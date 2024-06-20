const jwt = require('jsonwebtoken')
const User = require('../model/datamodal')

const getUserDetailsFromToken = async(token)=>{
    
    if(!token){
        return {
            message : "session out",
            logout : true,
        }
    }

    const decode = await jwt.verify(token,process.env.TOKEN_KEY)
    // console.log('Token decoded', decode);
    const user = await User.findById(decode.user_id).select('-password')
    // console.log('User found in DB', user);
    return user
}

module.exports = getUserDetailsFromToken