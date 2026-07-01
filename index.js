require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const session = require('express-session');

const authRoutes = require('./server/routes/auth');
const documentRoutes = require('./server/routes/documents');
const pollRoutes = require('./server/routes/polls');
const financialRoutes = require('./server/routes/financial');
const meetingRoutes   = require('./server/routes/meetings');
const app = express();


app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: 'scrum13-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 }
}));

app.use(express.static(path.join(__dirname, 'client')));

app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/polls', pollRoutes);
app.use('/api/financial', financialRoutes);
app.use('/api/meetings', meetingRoutes);

app.get('/', (req, res) => {
    res.redirect('/pages/MainPage/Login.html');
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});