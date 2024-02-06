import React from 'react';
import {useEffect,useState,useContext} from 'react';

import './View.css';
import { FirebaseContext } from '../../store/Context';
import {PostContext} from '../../store/PostContext'
function View() {

const [userDetails,setUserDetails] = useState(null)
const {postDetails} = useContext(PostContext);
const {firebase} = useContext(FirebaseContext)

useEffect(() => {
  console.log("Post details:", postDetails);
  const { userId } = postDetails;
  if (userId) {
    firebase.firestore().collection('users').doc(userId).get().then((doc) => {
      if (doc.exists) {
        setUserDetails(doc.data());
      } else {
        console.log('No such document!');
      }
    }).catch((error) => {
      console.log('Error getting document:', error);
    });
  }
}, [firebase, postDetails]);
  return (
    <div className="viewParentDiv">
      <div className="imageShowDiv">
        <img
          src={postDetails.url}
          alt=""
        />
      </div>
      <div className="rightSection">
        <div className="productDetails">
          <p>&#x20B9; {postDetails.price} </p>
          <span>{postDetails.name}</span>
          <p>{postDetails.category}</p>
          <span>{postDetails.createdAr}</span>
        </div>
       {userDetails && <div className="contactDetails">
          <p>Seller details</p>
          <p>{userDetails.username}</p>
          <p>{userDetails.phone}</p>
        </div>}
      </div>
    </div>
  );
}
export default View;
