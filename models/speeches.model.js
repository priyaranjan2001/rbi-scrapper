import mongoose from "mongoose";

const speechesSchema = new mongoose.Schema({
    date: {
        type: String
    },
    value: {
        type: String
    },
    link: {
        type: String
    },
    pdf: {
        type: String
    }
})

const speechesModel = mongoose.model("Speech", speechesSchema);

export default speechesModel;