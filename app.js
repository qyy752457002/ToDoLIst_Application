// Simple Node.js application using the Express framework

// 1. Imports and Setup:

// express, body-parser: These are Node.js modules for handling server requests and parsing request bodies.
// date.js: An external module (probably a custom module) for getting the current date.
const express = require('express');
const mongoose = require("mongoose")
const bodyParser = require('body-parser');
const date = require(__dirname + '/date.js');
const _ = require("lodash");

// 2. Express Setup:

// app is initialized as an instance of Express.
const app = express();

// 3. View Engine and Middleware Setup:

// app.set('view engine', 'ejs'): Sets EJS (Embedded JavaScript) as the view engine for rendering templates.
app.set('view engine', 'ejs');

// bodyParser.urlencoded() and express.static("public") are middleware functions.

// Configure middleware for an Express.js application using the body-parser package. 
// This line specifically sets up body-parser to parse URL-encoded data with extended mode, allowing for richer data to be encoded in the URL.
// When extended is set to true, body-parser allows the use of nested objects and arrays to be encoded into the URL-encoded data. 
// This enables you to send more complex data structures through forms or requests in an Express.js application.
app.use(bodyParser.urlencoded({extended: true}));

// configuring Express to serve static files from a directory named "public." 
// This is a common setup for serving assets like HTML, CSS, JavaScript, images, and other files that don't need to be processed by the server.
app.use(express.static("./public"));

// make connection to remote database
mongoose.connect("mongodb+srv://Krismile:Qyy2614102@todolistcluster.dalyaca.mongodb.net/todolistDB", {useNewUrlParser: true});

// establish an itemSchema
const itemSchema = new mongoose.Schema({
  name: String
}); 

// establish a listSchema
const listSchema = new mongoose.Schema({
  name: String,
  items: [itemSchema]
}); 

// estabish a listItem mongoose model as a collection
const listItem = mongoose.model("listItem", itemSchema);
// estabish a customItem mongoose model as a collection
const customList = mongoose.model("customList", listSchema);

const item1 = new listItem({
  name: "Apple"
})

const item2 = new listItem({
  name: "Banana"
})

const item3 = new listItem({
  name: "Orange"
})

// defaultItems are arrays to store items
const defaultItems = [];

const day = date.getDate();

// 4. Routing:

// app.get("/"): Handles GET requests to the root URL ("/"). 
// Renders the "list.ejs" template and passes the current day's date and listItems array to it.

// In order to ensure the default items are inserted before rendering the page, we use async/await with try/catch
// This modification uses async/await to wait for the insertMany operation to complete before fetching the items again and rendering the page. 
// This should ensure that the default items are available when the page is first loaded.
app.get("/", async function(req, res) {

  try {
    // return an array of items back
    var items = await listItem.find({});

    // no items exist in current ListItem database
    if (items.length === 0) {
      // insert all defaultItems to ListItem database
      // wait for this operation to complete
      // without async/await, it may jump to res.render("list.ejs", { listTitle: day, listItems: items })
      await listItem.insertMany(defaultItems);
      // print message in the console
      console.log("Successfully saved all items to listItem DB");

      // Fetch items again after insertion
      items = await listItem.find({});
    }
      res.render("list.ejs", { listTitle: day, listItems: items });

  } catch (err) {
    console.log(err);
    // Redirect to handle errors, if needed
    res.redirect("/");
  }

});

app.get("/:customListName", async function(req, res){

  const customListName = _.capitalize(req.params.customListName);

  try {
    // return an object back
    var foundList = await customList.findOne({name: customListName});

    // no items exist in current ListItem database
    if (!foundList) {
        // create a new list
        const list = new customList({
          name: customListName,
          items: defaultItems
        });

        // wait for this operation to complete
        await list.save();
        // print message in the console
        console.log("Successfully saved all items to customList DB");

        // return an object back
        foundList = await customList.findOne({name: customListName});
    }
      res.render("list.ejs", { listTitle: foundList.name, listItems: foundList.items });

  } catch (err) {
    console.log(err);
    // Redirect to handle errors, if needed
    res.redirect("/");
  }
});

// app.post("/"): Handles POST requests to the root URL ("/"). 
// Determines if the form submitted is for the work list or regular list. 
// Pushes the new item to the appropriate array and redirects the user to the corresponding route.
app.post("/", async function(req, res) {

  // 对应 <input type="text" name="newTodo" placeholder="New Item" autocomplete="off">
  const itemName = req.body.newTodo;
  // 对应 <button type="submit" name="listSubmit" value="<%= listTitle %>">+</button>
  const listName = req.body.listSubmit;

  const item = new listItem({
    name: itemName
  });

  try {
    if (listName === day) {
      await item.save();
      res.redirect("/");

    } else {

      const foundList = await customList.findOne({ name: listName });

      if (foundList) {
        foundList.items.push(item);

        await foundList.save();
        
        res.redirect("/" + listName);

      } else {
        throw new Error("List not found");
      }
    }

  } catch (err) {
    console.log(err);
    res.redirect("/");
  }
});

app.post("/delete", async function(req, res) {

  // 对应 <input type="checkbox" name="checkbox" value="<%= item._id %>" onChange="this.form.submit()">
  const checkedItemId = req.body.checkbox;
  // 对应 <Input type = "hidden" name = "listname" value = "<%= listTitle %>"></input>
  const listName = req.body.listname;

  try {
    if (listName === day) {
      const deletedItem = await listItem.findByIdAndDelete(checkedItemId);
      if (deletedItem) {
        console.log("Successfully deleted check item.");
      } else {
        console.log("Item not found or already deleted.");
      }
      res.redirect("/");

    } else {
      /* MongoDB removes document from an array */
      /* This operation removes an item from the items array within the document that matches the name specified in listName and has an _id matching checkedItemId.*/
      const result = await customList.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, {new: true});
      if (result) {
        console.log("Successfully deleted check item.");
      } else {
        console.log("Item not found or already deleted.");
      }
      res.redirect("/" + listName);
    }
  } catch (err) {
    console.log(err);
    // Handle error if needed
    res.redirect("/");
  }
});

// Server Listening:
// app.listen(3000): Starts the server on port 3000 and logs a message to the console once it's running.
app.listen(3000, function() {
  console.log("Server running on port 3000.");
});

// Overall, this code sets up a simple web server using Express, 
// defines routes for the root and work list pages, 
// handles form submissions to add items to lists, 
// and renders EJS templates to display the lists on the frontend.

/* 非常重要！所有与MongoDB交互的操作都要加await上去 */