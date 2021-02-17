const Photo = require('../models/photo.model');
const Voter = require('../models/voter.model');

/****** SUBMIT PHOTO ********/

exports.add = async (req, res) => {

  try {
    const { title, author, email } = req.fields;
    const file = req.files.file;

    if(title && author && email && file) { // if fields are not empty...
      title.replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

      author.replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

     const pattern = new RegExp(/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/);
     const emailMatch = email.match(pattern).join('')
     if(emailMatch.length === email.length) {
        res.json({message:'Ok'})
      } else throw Error('Wrong format. Perhaps forgot @')
      if(author.length <= 50 && title.length <= 25) {
        const fileName = file.path.split('/').slice(-1)[0];
        const extensions = ['gif', 'jpg', 'png']
      if(extensions.includes((fileName.split('.').pop()))){
        const newPhoto = new Photo({ title, author, email, src: fileName, votes: 0 });
        await newPhoto.save();
        res.json(newPhoto);
      } else {
        throw new Error('Wrong file extension!');
      }
    }
   
    } else {
      throw new Error('Wrong input!');
    }

  } catch(err) {
    res.status(500).json(err);
  }

};

/****** LOAD ALL PHOTOS ********/

exports.loadAll = async (req, res) => {

  try {
    res.json(await Photo.find());
  } catch(err) {
    res.status(500).json(err);
  }

};

/****** VOTE FOR PHOTO ********/

exports.vote = async (req, res) => {

  try {
    const photoToUpdate = await Photo.findOne({_id: req.params.id});
    const voter = await Voter.findOne({user: req.clientIp})
    if (!photoToUpdate) res.status(404).json({message: 'Not found'});
    else {
      if (voter) {
        if (voter.votes.includes(photoToUpdate._id)) {
          res.status(500).json({message: 'you can\'t vote again for the same photo'})
        } else {
          voter.votes.push(photoToUpdate._id);
          photoToUpdate.votes++;
          photoToUpdate.save();
          res.send({message: 'OK'});
        }
      } else {
        const newVoter = new Voter({
          user: req.clientIp,
          votes: [ photoToUpdate._id ]
        });
        await newVoter.save();
        photoToUpdate.votes++;
        photoToUpdate.save();
        res.send({message: 'OK'});
      }
    }
  } catch (err) {
    res.status(500).json(err);
  }
};
