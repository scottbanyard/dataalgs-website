# Educational Learning Resource for Data Structures & Algorithms

- Landing page containing list of data structures & algorithms
- Each, upon click, will give an example of how they work with PNGs / SVGs / animations
- User Login to their own account page with tabs for obvious user information (change password etc.), saved material, comments made, subscribed pages (?)
- Options for users to create their own dynamic pages with different (new ?) material, which they can choose to make private or public
- User's could possibly comments & rate different pages

---

# Reasons for using different languages & libraries:

## TypeScript

- Using TypeScript to use validation on types so that errors and bugs can be handled more efficiently
- JavaScript is very weakly typed and so prone to more errors

## AngularJS

- Very useful for dynamic pages
- Client-Side routing using ui-router allows for a Single-Page-Application, don't need to constantly refresh the page to load a new page, just changes view.

## Bootstrap

- Efficient styling options using grids

## D3 ?

- Slick graphics

## SQLITE3

- Embedded database

## XHTML / validation

- After many attempts of trying to integrate XHTML with Angular, we have decided that we are going to validate our HTML files ourselves to ensure all pages are correctly written to HTML standards. Angular's dynamic options are heavily reliant on boolean operators such as &&, but using a strict XHTML means we cannot use these but instead use &amp;&amp. We feel like this makes the HMTL unreadable. Other things like form validation for some reason didn't work with XHTML, as the dynamic button to submit a form stayed inactive even when input was given. We therefore backtracked to use the The Nu Html Checker (the vnu.jar validator) to ensure correctness in our HTML. We make sure we run this everytime we make a new page or a change in the HTML. (Probably should prove this somehow? Create logs? Idk)
