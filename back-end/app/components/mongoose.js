/**
 * Created on 19.01.16.
 */
import mongoose from 'mongoose';
import {MONGOOSE_URI} from '../config/constants';

mongoose.connect(MONGOOSE_URI);
mongoose.Promise = global.Promise;

export default mongoose;
