import { arrayRemove, arrayUnion, doc, increment, updateDoc } from "firebase/firestore";
import { db } from "./firebase";

export async function joinMatch(matchId : string , userId : string) {
  const matchRef = doc(db , 'matches' , matchId);

  await updateDoc(matchRef , {
    participants : arrayUnion(userId),
    currentParticipants : increment(1),
  })
  
}

export async function leaveMatch(matchId:string, userId : string, ) {
  const matchRef = doc(db , 'matches' , matchId);

  await updateDoc(matchRef , {
    participants : arrayRemove(userId),
    currentParticipants : increment(-1),
  })
  
}