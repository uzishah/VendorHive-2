import mongoose from 'mongoose';

// Define the Service schema
const serviceSchema = new mongoose.Schema({
  vendorId: { 
    type: Number, 
    required: true, 
    validate: {
      validator: function(v: number): boolean {
        return !isNaN(v) && v > 0;
      },
      message: (props: any) => `${props.value} is not a valid vendor ID!`
    }
  },
  name: { 
    type: String, 
    required: true 
  },
  category: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String, 
    required: true 
  },
  price: { 
    type: String, 
    required: true 
  },
  duration: String,
  location: String,
  imageUrl: String,
  timeSlots: [{ 
    day: String,
    startTime: String,
    endTime: String 
  }],
  availableDates: [Date],
  availability: { 
    type: Boolean, 
    default: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  id: { 
    type: Number, 
    required: true, 
    unique: true,
    validate: {
      validator: function(v: number): boolean {
        return !isNaN(v) && v > 0;
      },
      message: (props: any) => `${props.value} is not a valid positive numeric ID!`
    }
  } // Numeric ID field for internal references
});

// Add static methods
serviceSchema.statics.findByVendorId = function(vendorId: number) {
  return this.find({ vendorId });
};

serviceSchema.statics.findByCategory = function(category: string) {
  return this.find({ category });
};

serviceSchema.statics.findAvailable = function() {
  return this.find({ availability: true });
};

// Create a compound index on vendor and service name for faster lookups
serviceSchema.index({ vendorId: 1, name: 1 });

// Export the Service model
const ServiceModel = mongoose.models.Service || mongoose.model('Service', serviceSchema);

export default ServiceModel;