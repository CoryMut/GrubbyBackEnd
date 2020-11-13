// import AWS from "aws-sdk";

const AWS = require("aws-sdk");
const { accessKeyId, secretAccessKey } = require("../config");

/**
 * Digital Ocean Spaces Connection
 */

const upload = (file, folder, format, name) => {
    const spacesEndpoint = new AWS.Endpoint("sfo2.digitaloceanspaces.com");
    const s3 = new AWS.S3({
        endpoint: spacesEndpoint,
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey,
    });

    const bucketName = "grubbythegrape";
    let digitalOceanSpaces = "https://grubbythegrape.sfo2.digitaloceanspaces.com/";
    const blob = file;
    // const params = { Body: blob, Bucket: `${bucketName}`, Key: `${folder}/${blob.name}` };
    const params = { Body: blob, Bucket: `${bucketName}`, Key: `${folder}/${name}` };

    // Sending the file to the Spaces
    s3.putObject(params)
        .on("build", (request) => {
            request.httpRequest.headers.Host = `${digitalOceanSpaces}`;
            // request.httpRequest.headers["Content-Length"] = blob.size;
            // request.httpRequest.headers["Content-Type"] = blob.type;
            request.httpRequest.headers["Content-Type"] = format;
            request.httpRequest.headers["x-amz-acl"] = "public-read";
        })
        .send((error) => {
            console.log("IN .SEND");
            if (error) console.log(error);
            else {
                // If there is no error updating the editor with the imageUrl
                // imageUrl = `${digitalOceanSpaces}/${folder}` + blob.name;
                return;
            }
        });
};

module.exports = upload;
