export interface CustomerLookupResult {
  name: string
  email: string
  vip: boolean
}

export async function lookupCustomer(
  phone: string,
): Promise<CustomerLookupResult | null> {
  // BACKEND CONTRACT: swap body with
  //   return apiFetch<CustomerLookupResult>('/customers/lookup?phone=' + encodeURIComponent(phone))
  await new Promise((r) => setTimeout(r, 180))
  const normalized = phone.replace(/[\s\-.()]/g, "")
  const mock: Record<string, CustomerLookupResult> = {
    "03662794": { name: "Antoine Khoury", email: "antoine.khoury@gmail.com", vip: true },
    "70123456": { name: "Layla Nassar", email: "layla.n@hotmail.com", vip: false },
    "76543210": { name: "Charbel Hage", email: "", vip: true },
    "01337327": { name: "Maya Tabet", email: "m.tabet@outlook.com", vip: false },
  }
  return mock[normalized] ?? null
}
