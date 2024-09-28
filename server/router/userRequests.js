const express = require('express');
const router = express.Router();

//requseting user homepage after password verification 
router.get('/',(req,res)=>{
    if(req.session.role === 'user'){
        const userData = req.session.dbUserDetails;
        res.render('userhome',{userData})
    }else{
        res.render('loginpage',{displayMsg:'Unauthorised Acess'})
    }
});

module.exports = router;