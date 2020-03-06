const express = require('express')
const mysql = require('mysql')
const bodyParser = require('body-parser')
const session = require('express-session')
const jwt = require('jsonwebtoken')

const app = express()

app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));

const port = 6000;

const secretKey = 'thisisverysecretkey'

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
    extended: true
}))

const db = mysql.createConnection({
    host: '127.0.0.1',
    port: '3306',
    user: 'root',
    password: '',
    database: "sewamotor"
})

const isAuthorized = (request, result, next) => {
    // cek apakah user sudah mengirim header 'x-api-key'
    if (typeof(request.headers['x-api-key']) == 'undefined') {
        return result.status(403).json({
            success: false,
            message: 'Unauthorized. Token is not provided'
        })
    }

    // get token dari header
    let token = request.headers['x-api-key']

    // melakukan verifikasi token yang dikirim user
    jwt.verify(token, secretKey, (err, decoded) => {
        if (err) {
            return result.status(401).json({
                success: false,
                message: 'Unauthorized. Token is invalid'
            })
        }
    })

    // lanjut ke next request
    next()
}

//mencocokkan username dan password yang ada di database
app.post('/login/admin', function(request, response) {
    let data = request.body
	var username = data.username;
	var password = data.password;
	if (username && password) {
		db.query('SELECT * FROM admin WHERE username= ? AND password = ?', [username, password], function(error, results, fields) {
			if (results.length > 0) {
				request.session.loggedin = true;
				request.session.username = data.username;
				response.redirect('/login/admin');
			} else {
				response.send('Username dan/atau Password salah!');
			}			
			response.end();
		});
	} else {
		response.send('Masukkan Username and Password!');
		response.end();
	}
});


app.get('/login/admin', function(request, results) {
	if (request.session.loggedin) {
        let data = request.body
        let token = jwt.sign(data.username + '|' + data.password, secretKey)

        results.json({
            success: true,
            message: 'Login success, welcome back Admin!',
            token: token
        })
	} else {
        results.json({
            success: false,
            message:'Mohon login terlebih dahulu!'
        })
        }
	
	results.end();
});

//mencocokkan username dan password yang ada di database
app.post('/login/pelanggan', function(request, response) {
	var email = request.body.email;
	var password = request.body.password;
	if (email && password) {
		db.query('SELECT * FROM pelanggan WHERE email = ? AND password = ?', [email, password], function(error, results, fields) {
			if (results.length > 0) {
				request.session.loggedin = true;
				request.session.email = email;
				response.redirect('/home');
			} else {
				response.send('Email dan/atau Password salah!');
			}			
			response.end();
		});
	} else {
		response.send('Masukkan Email and Password!');
		response.end();
	}
});


app.get('/home', function(request, response) {
	if (request.session.loggedin) {
		response.send('Selamat Datang, ' + request.session.email + '!');
	} else {
		response.send('Mohon login terlebih dahulu!');
	}
	response.end();
});

/***** CRUD Motor ******/

app.get('/motor',isAuthorized, (req, res) => {
    let sql = `
        select merk, warna, stock, harga_sewa from motor
    `

    db.query(sql, (err, result) => {
        if (err) throw err

        res.json({
            message: "sukses mendapatkan data motor",
            data: result
        })
    })
})

app.get('/motor/user', (req, res) => {
    let sql = `
        select merk, warna, stock, harga_sewa from motor
    `

    db.query(sql, (err, result) => {
        if (err) throw err

        res.json({
            message: "sukses mendapatkan data motor",
            data: result
        })
    })
})

app.post('/motor',isAuthorized, (req, res) => {
    let data = req.body

    let sql = `insert into motor (merk, warna, stock, harga_sewa)
    values ('`+data.merk+`', '`+data.warna+`', '`+data.stock+`', '`+data.harga_sewa+`')
`

    db.query(sql, (err, result) => {
        if (err) throw err

        res.json({
            message: "Sukses!",
            data: result
        })
    })
})

app.get('/motor/:id_motor', isAuthorized, (req, res) => {
    let sql = `
        select * from motor
        where id_motor = `+req.params.id_motor+`
        limit 1
    `

    db.query(sql, (err, result) => {
        if (err) throw err

        res.json({
            message: "Sukses mendapatkan data detail",
            data: result[0]
        })
    })
})

app.put('/motor/:id_motor', isAuthorized, (req, res) => {
    let data = req.body

    let sql = `
        update motor
        set merk = '`+data.merk+`', warna = '`+data.warna+`', stock = '`+data.stock+`', harga_sewa = '`+data.harga_sewa+`'
        where id_motor = '`+req.params.id_motor+`'
    `

    db.query(sql, (err, result) => {
        if (err) throw err

        res.json({
            message: "Data berhasil diedit",
            data: result
        })
    })
})

app.delete('/motor/:id_motor', isAuthorized,(req, res) => {
    let sql = `
        delete from motor
        where id_motor = '`+req.params.id_motor+`'
    `

    db.query(sql, (err, result) => {
        if (err) throw err
        
        res.json({
            message: "Data berhasil dihapus",
            data: result
        })
    })
})

/***** CRUD Pelanggan ******/

app.get('/pelanggan', isAuthorized, (req, res) => {
    let sql = `
        select nama, alamat, kontak, email, password, created_at from pelanggan
    `

    db.query(sql, (err, result) => {
        if (err) throw err

        res.json({
            message: "Sukses mendapatkan semua data",
            data: result
        })
    })
})

app.post('/register/pelanggan',isAuthorized, (req, res) => {
    let data = req.body

    let sql = `insert into pelanggan (nama, alamat, kontak, email, password)
    values ('`+data.nama+`', '`+data.alamat+`', '`+data.kontak+`', '`+data.email+`', '`+data.password+`')
`

db.query(sql, (err, result) => {
    if (err) throw err

    res.json({
        message: "Data berhasil dibuat",
        data: result
    })
})
})



app.get('/pelanggan/:id_pelanggan', isAuthorized,(req, res) => {
let sql = `
    select * from pelanggan
    where id_pelanggan = `+req.params.id_pelanggan+`
    limit 1
`

db.query(sql, (err, result) => {
    if (err) throw err

    res.json({
        message: "Sukses mendapatkan data detail",
        data: result[0]
    })
})
})

app.put('/pelanggan/:id_pelanggan', isAuthorized,(req, res) => {
let data = req.body

let sql = `
    update pelanggan
    set nama = '`+data.nama+`', alamat = '`+data.alamat+`', kontak = '`+data.kontak+`', email = '`+data.email+`', password = '`+data.password+`'
    where id_pelanggan = '`+req.params.id_pelanggan+`'
`
db.query(sql, (err, result) => {
    if (err) throw err

    res.json({
        message: "Data berhasil diedit",
        data: result
    })
})
})

app.delete('/pelanggan/:id_pelanggan', isAuthorized,(req, res) => {
let sql = `
    delete from pelanggan
    where id_pelanggan = '`+req.params.id_pelanggan+`'
`

db.query(sql, (err, result) => {
    if (err) throw err
    
    res.json({
        message: "data berhasil dihapus",
        data: result
    })
})
})

/********** Transaksi **********/


app.post('/motor/:id/take', (req, res) => {
    let data = req.body
    
    db.query(`
        insert into transaksi (id_motor, id_pelanggan, jumlah_hari, total_bayar)
        values ('`+req.body.id_motor+`', '`+req.body.id_pelanggan+`', '`+req.body.jumlah_hari+`', '`+req.body.total_bayar+`')
    `, (err, result) => {
        if (err) throw err
    })
    
    db.query(`
        update motor
        set stock = stock - 1
        where id_motor = '`+req.body.id_motor+`'
        `, (err, result) => {
            if (err) throw err
        })
    
        res.json({
            message: "Berhasil melakukan transaksi!"
        })
    })

app.get('/pelanggan/:id/motor',(req, res) => {
    db.query(`
        select motor.merk, motor.warna
        from pelanggan
        right join transaksi on pelanggan.id_pelanggan = transaksi.id_pelanggan
        right join motor on transaksi.id_motor = motor.id_motor
        where pelanggan.id_pelanggan = '`+req.body.id_pelanggan+`'
    `, (err, result) => {
        if (err) throw err

        res.json({
            message: "Sukses!!",
            data: result
        })
    })
})

app.get('/transaksi/:id_transaksi', (req, res) => {
    let sql = `
    select id_motor, id_pelanggan, jumlah_hari, total_bayar from transaksi
    where id_transaksi = '`+req.params.id_transaksi+`'

`
db.query(sql, (err, result) => {
    if (err) throw err

    res.json({
        message: "Bukti telah transaksi!!",
        data: result[0]
    })
})
})

app.delete('/transaksi/:id_transaksi', isAuthorized, (req, res) => {    
    let data = req.params
    
    db.query(`
        delete from transaksi
        where id_transaksi = '`+req.params.id_transaksi+`'
    `, (err, result) => {
        if (err) throw err
    })
    
    db.query(`
        update motor
        set stock = stock + 1
        where id_motor = '`+req.params.id_motor+`'
        `, (err, result) => {
            if (err) throw err
        })
    
        res.json({
            message: "Motor telah dikembalikan!"
        })
    })
    app.delete('/motor/:id_motor/retake', isAuthorized, (req, res) => {
        let data = req.params
    
        db.query(`
            update motor
            set stock = stock + 1
            where id_motor = '`+req.params.id_motor+`'
            `, (err, result) => {
                if (err) throw err
            })
        
            res.json({
                message: "Stock berhasil dikembalikan!"
            })
        })
/********** Run Application **********/
app.listen(port, () => {
    console.log('App running on port ' + port)
})

