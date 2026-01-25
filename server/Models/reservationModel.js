import mongoose from 'mongoose';

const reservationSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  table_type: {
    type: String,
    required: true,
    enum: ['Parasol', 'Mini Cabane', 'Cabane']
  },
  reservation_date: {
    type: Date,
    required: true
  },
  start_time: {
    type: String,
    required: true
  },
  end_time: {
    type: String,
    required: true
  },
  num_people: {
    type: Number,
    required: true,
    min: 1
  },
  total_price: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'accepted', 'denied'],
    default: 'pending'
  }
}, {
  timestamps: true
});

const ReservationModel = mongoose.model('Reservation', reservationSchema);

export default ReservationModel;
