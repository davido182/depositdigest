// Stripe configuration
export const STRIPE_CONFIG = {
  // Publishable key is safe to use in frontend
  publishableKey: "pk_test_51RmUAfCN2cQsy6smRC0nEV3jL3lWeaZ6QUtgbcVzSiLaJOIAp6cvfGwDrgROx1OQ0jAsQSrfdMXPKxTVMhcbtZhG000UvmaNC4",
  // Secret key is stored securely in Supabase secrets and only used in edge functions
} as const;