
import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    }, 
    kinde_id: {
        type: String,
        required: true,
        unique: true
    },
    given_name: {
        type: String,  
    },
    stripeCustomerId: {
        type: String, 
        alias: 'stripe_customer_id'  // Maps to 'stripe_customer_id' in MongoDB
    },
    stripeSubscriptionId: {
        type: String, 
        alias: 'stripe_subscription_id'  // Maps to 'stripe_subscription_id' in MongoDB
    },
    stripePriceId: {
        type: String,
        alias: 'stripe_price_id'  // Maps to 'stripe_price_id' in MongoDB
    },
    stripeCurrentPeriodEnd: {
        type: Date,
        alias: 'stripe_current_period_end'  // Maps to 'stripe_current_period_end' in MongoDB
    }
})

export default mongoose.models.User || mongoose.model('User', userSchema)