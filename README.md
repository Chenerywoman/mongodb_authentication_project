# SQL Database project using Express and Handlebars

This was a CodeNation project to practise creating & accessing MongoDB collections with Node.js, hash passwords and authenticate users using tokens and cookies.   The backend used the Express web framework for Node.js.  The The frontend used the Handlebars templating language.

## Project Brief

The project brief was to create a website with various elements:
* authentication of users
* creating & accessing the MongoDB collections
* admin users with additional access to information on certain pages
* the following pages:
    - a registration page
    - a login page
    - a profile page
    - an update page
    - a new blog page
    - an all blogs page
    - a page showing all the blogs of the logged in user

## Authentication

The authentication features to include:
* no user id in the url 
* use web tokens to authenticate a user

### Registration page

The registration page must contain:

* functionality to stop a user registering with an email which is the same as one already stored in the MongoDB users collection.
* a password confirmation field, so the email can be confirmed before the email is checked against the other emails on the database and registered

### Profile page

The profile page must have:

* details of the logged in user
* redirecion to the login page if a user tries to access the profile page & they are not logged in
* four buttons
    - edit/update account - takes to edit page for the user
    - close account-removes the user from the MongoDB collection & redirects to confirmation page
    - new blog - takes to page to create a new blog
    - all user's blogs - takes to a page displaying all the user's blogs

### Update Page

The update page must have:

* functionality to input the old password
    - old password to be checked against the database
    - if old password is correct, password can be updated
* redirection to confirmation

### Close Account functionality

The close account functionality on the profile page should:

* only be possible for that logged in user
* delete the user from the MongoDB collection
* confirm deletion

### New blog page

The new blog page should enable a user to input 
* title
* body

### All blogs page

The all blog page should all all users to see all the blogs by all users.

### Blogs for an individual user

The page of blogs for an individual user should:
* show all the blogs to the user who is logged in
* enable the blog post to be edited
* allow the user to delete the blog post

## Admin account-all users page

If admin user is logged in, they can:
* access a page showing all users of in the collection
* update a user
* delete a user

# Admin account - all blogs page

If admin user is logged in, they can:
* access the page showing all blogs
* update a blog
* delete a blog

## Issues and solutions

Some issues I had and the solutions I came up with were:
* **Issue**: issues. 
* **Solution**: My solution contains the following steps:
 
## Dependencies

The dependencies for the project are:
  * express version 4.17.1
  * hbs (handlebars) version 4.1.1
  * nodemon version 2.0.7
  * jsonwebtoken 8.5.1
  * cookie-parser 1.4.5
  * bcryptjs 2.4.3
  * mongoose 5.11.10
  * dotenv 8.2.0

## Final stage: styling and responsiveness

Once the functionality was working, I used a helpful website (https://coolors.co/) to help me come up with a colour scheme for the webpage.  

I then worked on styling the website and making it responsive to different screen sizes, using media queries where required.