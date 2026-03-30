const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/propvalgh';

const clearDB = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('MongoDB Connected for cleanup');

        const db = mongoose.connection.db;

        // Collections to drop
        const collections = ['datacategories', 'constructioncosts', 'marketdatas'];

        for (const collName of collections) {
            const result = await db.listCollections({ name: collName }).toArray();
            if (result.length > 0) {
                await db.dropCollection(collName);
                console.log(`Dropped collection: ${collName}`);
            } else {
                console.log(`Collection ${collName} does not exist`);
            }
        }

        console.log('Database cleanup completed successfully');
        process.exit(0);
    } catch (err) {
        console.error('Error during database cleanup:', err);
        process.exit(1);
    }
};

clearDB();
