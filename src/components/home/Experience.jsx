import React, { useState, useEffect } from "react";
import axios from "axios";
import Pdf from "../../editable-stuff/resume.pdf";
import CompanyLogo from "../../images/company_logo.png";
import {
  aboutHeading,
  aboutDescription,
  showInstaProfilePic,
  instaLink,
  instaUsername,
  instaQuerry,
} from "../../editable-stuff/configurations.json";

const divStyle = {
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
};

const Experience = () => {
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
    <div id="experience" className="jumbotron jumbotron-fluid m-0">
      <div className="container container-fluid p-5">
        <i class="fa fa-space-shuttle fa-5x" aria-hidden="true"></i>
        <h1 className="display-4 pb-5">Experience</h1>
        <div className="row">
          <div className="col d-lg-inline align-self-center">
            <div className="row">
              <div className="col text-center">
                <img
                  // className="border border-secondary rounded-circle"
                  src={CompanyLogo}
                  alt="dell technologies logo"
                  width="300"
                  height="80"
                />
                <br />
                <br />
                <p className="lead text-center" style={{ fontSize: "22px" }}>
                  Specialist Engineer
                  <br />
                  April 2019 - Present
                </p>
              </div>
              <div className="col text-center">
                <img
                  // className="border border-secondary rounded-circle"
                  src={CompanyLogo}
                  alt="boeing logo"
                  width="300"
                  height="80"
                />
                <br />
                <br />
                <p className="lead text-center" style={{ fontSize: "22px" }}>
                  Lead Engineer
                  <br />
                  Nov 2015 - Mar 2019
                </p>
              </div>
            </div>
            <br />
            <br />
            <div className="row">
              <div className="col text-center">
                <img
                  // className="border border-secondary rounded-circle"
                  src={CompanyLogo}
                  alt="dell technologies logo"
                  width="300"
                  height="80"
                />
                <br />
                <br />
                <p className="lead text-center" style={{ fontSize: "22px" }}>
                  Senior Engineer
                  <br />
                  Nov 2011 - Oct 2015
                </p>
              </div>
              <div className="col text-center">
                <img
                  // className="border border-secondary rounded-circle"
                  src={CompanyLogo}
                  alt="boeing logo"
                  width="300"
                  height="80"
                />
                <br />
                <br />
                <p className="lead text-center" style={{ fontSize: "22px" }}>
                  Lead Engineer
                  <br />
                  July 2008 - Oct 2011
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Experience;
