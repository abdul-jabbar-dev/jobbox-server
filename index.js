const express = require('express')
require('dotenv').config()
const cors = require('cors')
const PORT = process.env.PORT || 19008
const app = express()
app.use(express.json())
const mongodb = require('mongodb');
app.use(cors())

const uri = process.env.MONGO_STRING;
const client = new mongodb.MongoClient(uri);

client.connect().then((mc) => {
    const db = client.db("jobbox")
    const userCollection = db.collection("users");
    const jobsCollection = db.collection("jobs");

    app.get('/users', async (req, res) => {
        const result = await userCollection.find().toArray()
        return res.send(result)
    })

    app.post('/users', async (req, res) => {
        const exist = await userCollection.findOne({ email: req.body.email })
        if (exist) {
            return res.status(400).send('Email already exist')
        }
        const result = await userCollection.insertOne(req.body)
        return res.send(result)
    })
    app.get('/users/:email', async (req, res) => {
        const { email } = req.params
        const exist = await userCollection.findOne({ email })
        if (exist) {
            return res.send(exist)
        } else {
            return res.json({ email, massage: 'data not found' })
        }
    })

    app.get('/jobs', async (req, res) => {
        const result = await jobsCollection.find().toArray()
        return res.send(result)
    })
    app.get('/appliedjob/:email', async (req, res) => {
        const thisemail = req.params.email
        const result = await jobsCollection.find({
            applications: {
                $elemMatch: {
                    candidateEmail: thisemail
                }
            }
        }).project({ applications: 0 }).toArray()
        res.send(result)

    })

    app.get('/jobs/:id', async (req, res) => {
        console.log('req')
        const { id } = req.params
        const exist = await jobsCollection.findOne({ _id: new mongodb.ObjectId(id) })
        return res.send(exist)
    })

    app.put('/apply', async (req, res) => {
        const {
            candidateId,
            candidateEmail,
            jobCircular
        } = req.body

        const modifier = {
            $push: {
                applications: {
                    candidateId: new mongodb.ObjectId(candidateId),
                    candidateEmail
                }
            }
        }
        const response = await jobsCollection.updateOne({ _id: new mongodb.ObjectId(jobCircular) }, modifier)
        if (response.acknowledged) {
            return res.send(response)
        }
        return res.send({ status: false })
    })

    app.put('/qus', async (req, res) => {
        const {

            massage,
            candidateId,
            circularId
        } = req.body
        const modifier = {
            $push: {
                qus: {
                    massageId: new mongodb.ObjectId(),
                    candidateId: new mongodb.ObjectId(candidateId),
                    massage
                }
            }
        }
        const response = await jobsCollection.updateOne({ _id: new mongodb.ObjectId(circularId) }, modifier)
        if (response.acknowledged) {
            console.log('hellow ')
            return res.send(response)
        }
        return res.send({ status: false })
    })

    app.put('/qus/reply', async (req, res) => {

        const {
            massage,
            circularId,
            massageId
        } = req.body

        const oldmodifier = {
            $addToSet: {
                "qus.$[element].reply": massage
            }
        }

        const oldmodifier2 = { arrayFilters: [{ "element.massageId": new mongodb.ObjectId(massageId) }], new: true }


        const respon = await jobsCollection.findOneAndUpdate({ _id: new mongodb.ObjectId(circularId) }, oldmodifier, oldmodifier2)
        console.log(respon)
        if (respon.acknowledged) {
            return res.send(respon)
        }
        return res.send({ status: false })
    })

})
app.get('/', (req, res) => {
    res.send('home')
})
app.listen(PORT, () => console.log('running'))