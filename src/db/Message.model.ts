import mongoose from 'mongoose'

// Define the schema for the new model
const messageSchema = new mongoose.Schema({
  id: {
    type: mongoose.Schema.Types.ObjectId,
    default: new mongoose.Types.ObjectId(),
  },
  text: {
    type: String,
    required: true
  }, 
  isUserMessage: {
    type: Boolean,
    required: true // Assuming URL is optional; if required, set to true
  }, 
  userId: {
    type: String, // Reference to the 'User' model kinde_id
    required: true
  }, 
  fileId: {
    type: String, // Reference to the 'File' model _id
    required: false
  }, 

}, {
  timestamps: true // Automatically adds createdAt and updatedAt fields
});

// Create the model from the schema
export default mongoose.models.Message ||  mongoose.model('Message', messageSchema);
