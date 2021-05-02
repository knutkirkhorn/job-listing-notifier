const got = require('got');
const config = require('../config');
const {httpHeader} = require('../util');

const {jobLocation} = config;
const apiUrl = config.tihldeAPIUrl;
const listingUrlPath = config.tihldeListingUrlPath;

// Array to store the previous job listings in
// Used to check if there are new job listings
let oldJobListings = [];

async function getNewJobListings() {
    const response = await got(apiUrl, {headers: httpHeader});
    const body = JSON.parse(response.body);
    const jobListings = body.results;

    // Filter on job location only as TIHLDE's API does not store job type
    const filteredJobListings = jobListings.filter(jobListing => jobListing.location === jobLocation);

    const currentJobListings = filteredJobListings.map(jobListing => {
        const {title, company} = jobListing;
        const deadline = new Date(jobListing.deadline);

        return {
            title,
            company,
            deadline,
            source: 'tihlde',
            url: `${listingUrlPath}${jobListing.id}`
        };
    });

    const newJobListings = currentJobListings.filter(
        jobListing => !oldJobListings.some(
            oldJobListing => oldJobListing.title === jobListing.title
            && oldJobListing.company === jobListing.company
            && oldJobListing.deadline.getTime() === jobListing.deadline.getTime()
        )
    );

    // Set the old jobs to the new jobs if there are new jobs
    if (newJobListings.length > 0) {
        oldJobListings = currentJobListings;
    }

    return newJobListings;
}

module.exports.getNewJobListings = getNewJobListings;
