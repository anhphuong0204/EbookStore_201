var express = require('express');
var SHA256 = require('crypto-js/sha256');
var moment = require('moment');
var format = require('date-format');
// var accountRepo = require('../repos/accountRepo');
// var payRepo = require('../repos/payRepo');
var restrict = require('../middle-wares/restrict');
var Recaptcha = require('express-recaptcha').Recaptcha;
//var recaptcha = new Recaptcha('6LdoIGEUAAAAADW83_JdZknEjFYPl7bLmJD_YVzo', '6LdoIGEUAAAAANFjdBJxqiedi0D8wd3FtVWxCJUN');
var nodemailer =  require('nodemailer'); // khai báo sử dụng module nodemailer
var db=require('../select');
var router = express.Router();
router.get('/signup', (req, res) => {
    res.render('./account/signup');
});
router.post('/signup', (req, res) => {
    var user = {
        username: req.body.username,
        password: SHA256(req.body.pass).toString(),
        fname: req.body.fname,
        mname: req.body.miname,
        lname: req.body.lname,
        address: req.body.address,
        phonenumber: req.body.phone,
        email: req.body.email,
        dob: req.body.dob,
        sex: req.body.sex,   
        permission: 0,
	};
	var sql =`call createaccout ('${user.fname}','${user.mname}','${user.lname}',\
    '${user.username}','${user.password}',\
    '${user.dob}','${user.sex}','${user.phonenumber}','${user.address}','${user.email}')`;
        db.query(sql, function(error, value) {
            if (error) {
                var vm = {
                    showError: true,
                    errorMsg: 'Đã tồn tại tài khoản này'
                };
                res.render('./account/signup', vm);
            } else {
                res.redirect('/account/login');  
            }
});
});
router.get('/login', (req, res) => {
    res.render('./account/login');
});
router.post('/login', (req, res) =>{
    var user = {
        username: req.body.username,
        password: SHA256(req.body.pass).toString()
    
    };
    //console.log(user.password);
    var sql =`call check_pass('${user.username}','${user.password}')`;
    //db.connect();
        db.query(sql, function(error,value) {
            //db.end();
            if (JSON.stringify(value[0])==='[]') {
                    var vm = {
                    showError: true,
                    errorMsg: 'Tên hoặc mật khẩu không đúng.',
                };
                res.render('./account/login', vm);
            } else {
                //console.log(value[0][0].FName)
                req.session.isLogged = true;
                req.session.Authorized=0;
                req.session.user=user.username;
                req.session.account=value[0][0];
                //req.session.name=value[0][0].FName+' '+value[0][0].LName;
                //req.session.id=user.username;
                //console.log(req.session.account);
                var url = '/';
                if (req.query.retUrl) {
                    url = req.query.retUrl;
                }
                res.redirect(url);
            }
            //db.end();
});
});
router.post('/logout', (req, res) => {
    req.session.isLogged = false;
    req.session.user = null;
    req.session.account=null;
    req.session.Authorized = 0;
    req.session.cart = [];
    res.redirect('/');
});
router.get('/profile', restrict, (req, res) => {
    var vm = {
        donHang: '',
        name: req.session.account.FName +' '+req.session.account.LName+' '+ req.session.account.MName,
        diachi: req.session.account.Address,
        sdt: req.session.account.PhoneNumber,

    };
    res.render('./account/profile', vm);
});
router.get('/update', (req, res) => {
    var vm={
        FName: req.session.account.FName,
        MName:req.session.account.MName,
        LName:req.session.account.LName,
        phone: req.session.account.PhoneNumber,
        addr: req.session.account.Address,
        mail:req.session.account.Mail
    }
    res.render('./account/update',vm);
});
router.post('/update',(req,res)=>{
    var user = {
        id:req.session.account.ID,
        fname: req.body.fname,
        mname: req.body.miname,
        lname: req.body.lname,
        address: req.body.address,
        phonenumber: req.body.phone,
        email: req.body.email,   
        permission: 0
    };
    var sql =`call update_info_cus ('${user.id}','${user.fname}','${user.mname}','${user.lname}',\
    '${user.phonenumber}','${user.address}','${user.email}')`;
    db.query(sql, function(error, value) {
        if (error) {
            var vm = {
                showError: true,
                errorMsg: 'Cập nhật thông tin thất bại !!!!!!',
                FName: req.session.account.FName,
                MName:req.session.account.MName,
                LName:req.session.account.LName,
                phone: req.session.account.PhoneNumber,
                addr: req.session.account.Address,
                mail:req.session.account.Mail
            };
            res.render('./account/update', vm);
        } else {
            req.session.account=value[0][0];
            var vm = {
                Success: true,
                Msg: 'Cập nhật thông tin thành công',
                FName: req.session.account.FName,
                MName:req.session.account.MName,
                LName:req.session.account.LName,
                phone: req.session.account.PhoneNumber,
                addr: req.session.account.Address,
                mail:req.session.account.Mail
            };
            res.render('./account/update', vm); 
        }
});
});
router.get('/update_pass',(req,res)=>{
    res.render('./account/updatepass');
});
router.post('/update_pass',(req,res)=>{
var sql=`call update_pass('${req.session.account.ID}','${SHA256(req.body.mkcu).toString()}','${SHA256(req.body.mkmoi1).toString()}')`;
db.query(sql,function(error,value){
if (error){
    var vm = {
        showError: true,
        errorMsg: 'Mật khẩu không trùng khớp bạn vui long nhập lại mật khẩu hiện tại'};
        res.render('./account/updatepass',vm);
}
else{
    var vm = {
        showMsg: true,
        Msg: 'Cập nhật mật khẩu thành công'};
        res.render('./account/updatepass',vm);
}
});
});
module.exports = router;
// router.post('/login', (req, res) => {
//     var user = {
//         username: req.body.username,
//         password: SHA256(req.body.pass).toString()
//     };
//     accountRepo.login(user).then(rows => {
//         if (rows.length > 0) {
//             req.session.isLogged = true;
//             req.session.user = rows[0];
//             req.session.Authorized = rows[0].loaiNguoiDung;
//             if (rows[0].loaiNguoiDung === 0) {
//                 var url = '/';
//                 if (req.query.retUrl) {
//                     url = req.query.retUrl;
//                 }
//                 res.redirect(url);
//             } else {
//                 res.redirect('../manager/dashboard');
//             }


//         } else {

//             var vm = {
//                 showError: true,
//                 errorMsg: 'Tên hoặc mật khẩu không đúng.',
//             };
//             res.render('account/dang-nhap', vm);
//         }
//     });
// });