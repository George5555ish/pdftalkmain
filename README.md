This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Starter code for Any SASS

# TRPC
# Nextjs
# Kinde (Authentication)
# MongoDB


# PRODUCTION DEPLOYMENT NOTES

Please note the following when deploying to production: 

* Check your ENVs (particularly for stripe keys, to be live keys and not api)

* Check your plans, and ensure you're on production plans and not test plans.

* Test webhooks for updating db when user makes payment for a plan.

* Check the db and ensure only select IPs can access it (not from anywhere)