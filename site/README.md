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

## D3.js

- Slick graphics

## SQLITE3

- Embedded database

## XHTML / validation

- XHTML introduces stricter error handling. A lot of current websites are and displayed despite technical errors because of the lack of validation in HTML.

## Express.js

- Easy to setup an API
- Delivers XHTML from HTML pages
- Uses SSL certs / keys to provide a secure HTTPS server to ensure safe data transmission (certs / keys created using openSSL http://www.robpeck.com/2010/10/google-chrome-mac-os-x-and-self-signed-ssl-certificates/#.WM8JaxKLQl4)
- 'Helmet can help protect your app from some well-known web vulnerabilities by setting HTTP headers appropriately. Helmet is actually just a collection of nine smaller middleware functions that set security-related HTTP headers'

## JSON Web Tokens (JWT)
- They can be cryptographically signed and encrypted to prevent tampering on the client side.

## GIMP Notes (PNG)
- Used different layers to be able to control overlay
- Used text tool
- Imported a splatter brush shapes to make background of icon using airbrush tool
- Imported a png image into the icon and used the magic brush tool to discard white around the image (make transparent)
- Used textures for background
- Used airbrush to make names.png border on the perimeter and the border inside around the text. Used the Dissolve filter on the airbrushed layer for the border inside around the text. I then used the airbrush tool to create patterns either side of the text, and the light blue (60% opacity) background of the text.

## INKSCAPE Notes (SVG)
- Used image as a trace sheet - lowered opacity so could see my pen marks
- Used bezier curve tool to create curved brush marks
- Used object stroke and fill option to colour the bezier curve tool, and fill in shapes I created
- This allowed me to create ellipse-like shapes, and straight lines
- Used the circular tool to create accurate, symmetrical circles
- Used spiral tool to create spiral shapes, used star tool to create star shapes, used polygon tool to create polygon shapes
- Used the transformations tool box to scale and rotate objects
- Grouped objects that all have the same relationship - e.g. grouped all spirals in one of my SVG images so that I can edit them all together. Grouped all bezier curves so, for example, I could transform the whole bear with one click, and not have to select each separate bezier curve that makes up the bear before transforming.
- When importing images to trace, use transformations tool box to scale images down to fix tracing box
- Used the Object to Pattern tool to create a patterned background
- Used the gradient fill tool to create a radial gradient colouring
- Create own gradient
- Used the brush tool
- Used blur percentage tool
- Used text tool
- Used layers to allow objects to overlay each other. For example, I wanted text to rest on top of a polygon shape, and so created a new layer that was above the other layer, and added the text to this new layer.
