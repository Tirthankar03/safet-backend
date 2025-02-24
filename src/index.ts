import express, { json, urlencoded } from 'express'
import multer from 'multer'




const app = express()
app.use(urlencoded({extended: false}))
app.use(json())


interface MulterRequest extends Request {
    files?: {
      [fieldname: string]: Express.Multer.File[];
    } | Express.Multer.File[];
  }


const fileFilter = (req: MulterRequest, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg') {
        cb(null, true);
      } else {
        cb(null, false);
      }
}



//multer config
const upload = multer({
    storage: multer.memoryStorage(),
    // fileFilter: fileFilter,
})

const port = 3005


app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.post('/upload', upload.single('image'), async (req, res) => {
  
  try {
    console.log('file in backend>>>>>>>>>>>>', req.file);
    // console.log('file in backend>>>>>>>>>>>>', req.file?.path);

    const file = req.file
    if(!file){
        console.log('no file found');
        
        res.status(401).send('No file uploaded')
    }

    const fileName = Date.now() + "-" + file?.originalname
    console.log('file name updated');
    
    
} catch (err) {
    console.error('error during upload>>>', err)
}
})




app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
