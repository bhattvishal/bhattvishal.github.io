import React, { useState, useEffect } from "react";
import axios from "axios";
import Pdf from "../../editable-stuff/resume.pdf";
import {
  aboutHeading,
  aboutDescription,
  showInstaProfilePic,
  instaLink,
  instaUsername,
  instaQuerry,
} from "../../editable-stuff/configurations.json";

const Skills = () => {
  const [instaProfilePic, setInstaProfilePic] = useState("");
  const [showInsta, setShowInsta] = useState(showInstaProfilePic);
  const [resumeURL] = useState(Pdf);

  useEffect(() => {
    if (showInsta) {
      handleRequest();
    }
  }, [showInsta]);

  const handleRequest = (e) => {
    axios
      .get(instaLink + instaUsername + instaQuerry)
      .then((response) => {
        // handle success
        // console.log(response.data.graphql);
        return setInstaProfilePic(
          response.data.graphql.user.profile_pic_url_hd
        );
      })
      .catch((error) => {
        // handle error
        setShowInsta(false);
        return console.error(error.message);
      })
      .finally(() => {
        // always executed
      });
  };

  return (
    <div id="skills" className="jumbotron jumbotron-fluid bg-transparent m-0">
      <div className="container container-fluid p-5">
        <i class="fa fa-flag fa-5x" aria-hidden="true"></i>
        <h1 className="display-4 pb-5">Skills</h1>
        <div className="row">
          <div className="row">
            <div class="col-sm-6">
              <div class="card"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Skills;
