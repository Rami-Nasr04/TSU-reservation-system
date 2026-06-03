import {
  AssociateSoftwareTokenCommand,
  CognitoIdentityProviderClient,
  ConfirmDeviceCommand,
  InitiateAuthCommand,
  RespondToAuthChallengeCommand,
  VerifySoftwareTokenCommand,
  type AuthenticationResultType,
  type ChallengeNameType,
} from "@aws-sdk/client-cognito-identity-provider"
import { createDeviceVerifier } from "cognito-srp-helper"

const REGION = import.meta.env.VITE_COGNITO_REGION
const USER_POOL_ID = import.meta.env.VITE_COGNITO_USER_POOL_ID
const CLIENT_ID = import.meta.env.VITE_COGNITO_APP_CLIENT_ID

if (!REGION || !USER_POOL_ID || !CLIENT_ID) {
  // Fail loud on misconfigured environments. AuthContext callers see this when
  // they hit the first SDK call.
  console.warn(
    "Cognito env vars missing — VITE_COGNITO_REGION/USER_POOL_ID/APP_CLIENT_ID required",
  )
}

const client = new CognitoIdentityProviderClient({ region: REGION })

export interface AuthChallenge {
  challengeName: ChallengeNameType
  session: string
}

export interface AuthSuccess {
  authenticationResult: AuthenticationResultType
}

export type AuthOutcome = AuthChallenge | AuthSuccess

function toOutcome(res: {
  AuthenticationResult?: AuthenticationResultType
  ChallengeName?: ChallengeNameType
  Session?: string
}): AuthOutcome {
  if (res.AuthenticationResult) return { authenticationResult: res.AuthenticationResult }
  if (res.ChallengeName && res.Session)
    return { challengeName: res.ChallengeName, session: res.Session }
  throw new Error("Unexpected Cognito response: no tokens and no challenge")
}

export async function initiateUserPasswordAuth(
  email: string,
  password: string,
  deviceKey?: string | null,
): Promise<AuthOutcome> {
  const AuthParameters: Record<string, string> = {
    USERNAME: email,
    PASSWORD: password,
  }
  if (deviceKey) AuthParameters.DEVICE_KEY = deviceKey
  const res = await client.send(
    new InitiateAuthCommand({
      AuthFlow: "USER_PASSWORD_AUTH",
      ClientId: CLIENT_ID,
      AuthParameters,
    }),
  )
  return toOutcome(res)
}

export async function initiateRefresh(
  refreshToken: string,
  deviceKey?: string | null,
): Promise<AuthOutcome> {
  const AuthParameters: Record<string, string> = { REFRESH_TOKEN: refreshToken }
  if (deviceKey) AuthParameters.DEVICE_KEY = deviceKey
  const res = await client.send(
    new InitiateAuthCommand({
      AuthFlow: "REFRESH_TOKEN_AUTH",
      ClientId: CLIENT_ID,
      AuthParameters,
    }),
  )
  return toOutcome(res)
}

export async function respondNewPassword(
  session: string,
  username: string,
  newPassword: string,
): Promise<AuthOutcome> {
  const res = await client.send(
    new RespondToAuthChallengeCommand({
      ClientId: CLIENT_ID,
      ChallengeName: "NEW_PASSWORD_REQUIRED",
      Session: session,
      ChallengeResponses: { USERNAME: username, NEW_PASSWORD: newPassword },
    }),
  )
  return toOutcome(res)
}

export async function associateSoftwareToken(
  session: string,
): Promise<{ secretCode: string; session: string }> {
  const res = await client.send(new AssociateSoftwareTokenCommand({ Session: session }))
  if (!res.SecretCode || !res.Session)
    throw new Error("AssociateSoftwareToken returned no secret or session")
  return { secretCode: res.SecretCode, session: res.Session }
}

export async function verifySoftwareToken(
  session: string,
  userCode: string,
): Promise<{ status: "SUCCESS" | "ERROR"; session?: string }> {
  const res = await client.send(
    new VerifySoftwareTokenCommand({ Session: session, UserCode: userCode }),
  )
  return { status: res.Status === "SUCCESS" ? "SUCCESS" : "ERROR", session: res.Session }
}

export async function respondMfaSetup(
  session: string,
  username: string,
): Promise<AuthOutcome> {
  const res = await client.send(
    new RespondToAuthChallengeCommand({
      ClientId: CLIENT_ID,
      ChallengeName: "MFA_SETUP",
      Session: session,
      ChallengeResponses: { USERNAME: username },
    }),
  )
  return toOutcome(res)
}

export async function respondSoftwareTokenMfa(
  session: string,
  username: string,
  code: string,
): Promise<AuthOutcome> {
  const res = await client.send(
    new RespondToAuthChallengeCommand({
      ClientId: CLIENT_ID,
      ChallengeName: "SOFTWARE_TOKEN_MFA",
      Session: session,
      ChallengeResponses: { USERNAME: username, SOFTWARE_TOKEN_MFA_CODE: code },
    }),
  )
  return toOutcome(res)
}

// Register the device with Cognito so subsequent sign-ins can skip the MFA
// challenge (pool config: "Always remember devices" + "Trust remembered
// devices to suppress MFA"). Cognito treats DEVICE_KEY as untrusted until
// ConfirmDevice has been called with a SRP password verifier. The helper
// returns the DeviceRandomPassword we store locally for any future
// DEVICE_PASSWORD_VERIFIER challenge.
export async function confirmDevice(
  accessToken: string,
  deviceKey: string,
  deviceGroupKey: string,
  deviceName?: string,
): Promise<{ devicePassword: string }> {
  const { DeviceRandomPassword, DeviceSecretVerifierConfig } =
    createDeviceVerifier(deviceKey, deviceGroupKey)
  await client.send(
    new ConfirmDeviceCommand({
      AccessToken: accessToken,
      DeviceKey: deviceKey,
      DeviceName:
        deviceName ??
        (typeof navigator !== "undefined"
          ? navigator.userAgent.slice(0, 80)
          : "Browser"),
      DeviceSecretVerifierConfig,
    }),
  )
  return { devicePassword: DeviceRandomPassword }
}

// Lightweight JWT claims parse (no signature verify — backend authorizer is
// the source of truth for trust). We only need `email`, `name`, `sub`,
// `cognito:groups`, `exp` for in-app display + refresh timing.
export function parseIdTokenClaims(idToken: string): {
  sub: string
  email: string
  name: string
  groups: string[]
  exp: number
} {
  const parts = idToken.split(".")
  if (parts.length !== 3) throw new Error("Malformed idToken")
  const padded = parts[1].replace(/-/g, "+").replace(/_/g, "/")
  const json = atob(padded + "=".repeat((4 - (padded.length % 4)) % 4))
  const payload = JSON.parse(json) as Record<string, unknown>
  const rawGroups = payload["cognito:groups"]
  const groups = Array.isArray(rawGroups) ? (rawGroups as string[]) : []
  return {
    sub: String(payload.sub ?? ""),
    email: String(payload.email ?? ""),
    name: String(payload.name ?? ""),
    groups,
    exp: Number(payload.exp ?? 0),
  }
}
