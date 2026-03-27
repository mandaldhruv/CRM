require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const { testConnection } = require('./db');

const app = express();
const PORT = Number(process.env.PORT || 5000);

const corsOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean)
    : true;

app.use(helmet());
app.use(cors({
    origin: corsOrigins,
    credentials: true
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is healthy'
    });
});

// Mount feature routes here.
const dashboardRoutes = require('./src/routes/dashboard.routes');
app.use('/api/v1/dashboard', dashboardRoutes);
const membersRoutes = require('./src/routes/members.routes');
app.use('/api/v1/members', membersRoutes);
// Example:
// app.use('/api/v1/dashboard', dashboardRoutes);

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

app.use((error, req, res, next) => {
    console.error('[SERVER ERROR]', error.message);

    if (res.headersSent) {
        return next(error);
    }

    return res.status(error.statusCode || 500).json({
        success: false,
        message: error.publicMessage || 'Internal server error'
    });
});

const startServer = async () => {
    try {
        await testConnection();

        app.listen(PORT, () => {
            console.log(`[SERVER] Listening on port ${PORT}`);
        });
    } catch (error) {
        console.error('[SERVER] Startup failed.');
        console.error(error.message);
        process.exit(1);
    }
};

process.on('unhandledRejection', (error) => {
    console.error('[PROCESS] Unhandled rejection detected.');
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
});

process.on('uncaughtException', (error) => {
    console.error('[PROCESS] Uncaught exception detected.');
    console.error(error.message);
    process.exit(1);
});

startServer();

module.exports = app;
