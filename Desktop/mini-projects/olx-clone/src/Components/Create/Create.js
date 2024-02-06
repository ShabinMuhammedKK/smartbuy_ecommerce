import React, { Fragment,useContext,useState } from 'react';
import { useHistory } from 'react-router';
import './Create.css';
import Header from '../Header/Header';
import {FirebaseContext,AuthContext} from '../../store/Context'


const Create = () => {
  const [name,setName] = useState("")
  const [catergory,setCategory] = useState("");
  const [price,setPrice] = useState("")
  const [image,setImage] = useState(null)
  const {firebase} = useContext(FirebaseContext)
  const {user} = useContext(AuthContext);
  const date = new Date();
  const history = useHistory();

const handleSubmit = ()=>{
  firebase.storage().ref(`/images/${image.name}`).put(image).then(({ref})=>{
    ref.getDownloadURL().then((url)=>{
      firebase.firestore().collection('products').add({
        name,
        catergory,
        price,
        url,
        userID:user.uid,
        createdAr: date.toDateString()
      })
      history.push('/')
    })
  })
}

  return (
    <Fragment>
      <Header />
      <card>
        <div className="centerDiv">
          <form>
            <label htmlFor="fname">Name</label>
            <br />
            <input
              className="input"
              type="text"
              id="fname"
              name="Name"
              defaultValue="John"
              value={name}
              onChange={(e)=>{
                setName(e.target.value)
              }}
            />
            <br />
            <label htmlFor="fname">Category</label>
            <br />
            <input
              className="input"
              type="text"
              id="fname"
              name="category"
              defaultValue="John"
              value={catergory}
              onChange={(e)=>{
                setCategory(e.target.value);
              }}
            />
            <br />
            <label htmlFor="fname">Price</label>
            <br />
            <input className="input"
             type="number"
              id="fname" 
              name="Price"
              value={price}
              onChange={(e)=>{
                setPrice(e.target.value);
              }}
              />
            <br />
          </form>
          <br />
          <img alt="Posts" width="200px" height="200px" src={image?URL.createObjectURL(image):''}></img>
          
            <br />
            <input
            onChange={(e)=>{
              setImage(e.target.files[0])
            }}
            type="file" />
            <br />
            <button onClick={handleSubmit} className="uploadBtn">upload and Submit</button>
          
        </div>
      </card>
    </Fragment>
  );
};

export default Create;
