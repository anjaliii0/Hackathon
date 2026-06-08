const express=require('express');
const cors=require('cors');
const authRoutes = require('./routes/auth.routes');
const studentRoutes = require('./routes/student.routes');
const collegeRoutes = require('./routes/college.routes');
const companyRoutes = require('./routes/company.routes');
//const applicationRoutes = require('./routes/application.routes');
const teamRoutes = require('./routes/team.routes');
const submissionRoutes = require('./routes/submission.routes');
const adminRoutes = require('./routes/admin.routes');
const hackathonRoutes = require('./routes/hackathon.routes');
const organizerRoutes = require('./routes/organizer.routes');
const registrationRoutes = require('./routes/registration.routes');
const notificationRoutes = require('./routes/notification.routes');
const homeRoutes = require('./routes/home.routes');


const app=express();

//middleware
 app .use(cors());
 app.use(express.json());

//routes
app.get('/',(req,res)=>{
    res.send('Backend Running!');
});

app.use('/api/auth', authRoutes);

app.use('/api/student', studentRoutes);

app.use('/api/college', collegeRoutes);

app.use('/api/company', companyRoutes);

//app.use('/api/applications', applicationRoutes);

app.use('/api/teams', teamRoutes);

app.use('/api/submissions', submissionRoutes);

app.use('/api/admin', adminRoutes);
app.use('/api/hackathons', hackathonRoutes);
app.use('/api/organizer', organizerRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/home', homeRoutes);




module.exports=app; 