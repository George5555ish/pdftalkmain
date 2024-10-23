import mongoose from 'mongoose'

// Define the schema for the new model
const uploadSchema = new mongoose.Schema({
  id: {
    type: mongoose.Schema.Types.ObjectId,
    default: new mongoose.Types.ObjectId(),
  },
  name: {
    type: String,
    required: true
  },
  uploadStatus: {
    type: String,
    enum: ['PENDING', 'PROCESSING', 'FAILED', 'SUCCESS'], // Enum values for status
    default: 'PENDING'  // Default value for upload status
  },
  url: {
    type: String,
    required: false // Assuming URL is optional; if required, set to true
  },
  key: {
    type: String,
    unique: true,
    required: true  // Assuming key is required; adjust if necessary
  },
  userId: {
    type: String, // Reference to the 'User' model kinde_id
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now // Set default to current date/time when a document is created
  },
  updatedAt: {
    type: Date,
    default: Date.now // Set default to current date/time and update this field when the document is updated
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt fields
});

// Create the model from the schema
export default mongoose.models.File ||  mongoose.model('File', uploadSchema);
