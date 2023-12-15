// estabish an item object
const item1 = new listItem({
    name: "Welcome to your todolist!"
  });
  
// estabish an item object
const item2 = new listItem({
    name: "Hit the + button to add a new item."
});
  
// estabish an item object
const item3 = new listItem({
    name: "<-- Hit this to delete an item"
});
  
// establish defaultItems
const defaultItems = [item1, item2, item3];









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









// Use Promise Chain
app.get("/", function(req, res) {

  const day = date.getDate();

  listItem.find({})
    // receive an array of items from listItem.find({})
    .then((items) => {
      if (items.length === 0) {
        // Insert defaultItems and wait for the operation to complete
        return listItem.insertMany(defaultItems)
          // receive nothing from previous chain
          .then(() => {
            console.log("Successfully saved all items to listItem DB");
            return listItem.find({}); // Fetch items after insertion
          });
      } else {
        // return existing items if they exist
        return items; 
      }
    })
    // receive an array of items from previous chain
    .then((items) => {
      res.render("list.ejs", { listTitle: day, listItems: items });
    })
    .catch((err) => {
      console.log(err);
      // Redirect to handle errors, if needed
      res.redirect("/");
    });
});

// Use Promise Chain
app.get("/:customListName", function(req, res){

  const customListName = req.params.customListName;

  // check whether the custom listname exists in customList database
  // return an object back instead of an array
  customList.findOne({name: customListName})
    // receive an object from customList.findOne({name: customListName})
    .then((foundList) => {
      // foundList does not exist in the customList database
      if (!foundList) {
        // create a new list
          const list = new customList({
          name: customListName,
          items: defaultItems
        });

          return list.save()

            // receive nothing from previous chain
            .then(() => {
              console.log("Successfully add list to customList database")
              return customList.findOne({name: customListName})
            })

        } else {
          return foundList
        }
    })
    // receive an object from previous chain
    .then((foundList) => {
      // show an existing list
      res.render("list.ejs", { listTitle: foundList.name, listItems: foundList.items });
    })
    .catch((err) => {
        console.log(err);
      // Redirect to handle errors, if needed
      res.redirect("/");
    });
});

// app.post("/"): Handles POST requests to the root URL ("/"). 
// Determines if the form submitted is for the work list or regular list. 
// Pushes the new item to the appropriate array and redirects the user to the corresponding route.
app.post("/", function(req, res){

  const itemName = req.body.newTodo;
  const listName = req.body.listSubmit;

  const item = new listItem({
    name: itemName
  });

  if (listName === day) {
    return item.save()
      .then(() => {
        res.redirect("/");
      })
      .catch(err => {
        console.log(err);
        res.redirect("/");
      });
  } else {
    customList.findOne({ name: listName })
      .then((foundList) => {
        if (foundList) {
          foundList.items.push(item);
          return foundList.save();
        } else {
          // Handle case where listName is not found
          throw new Error("List not found");
        }
      })
      .then(() => {
        res.redirect("/" + listName);
      })
      .catch(err => {
        console.log(err);
        res.redirect("/");
      });
  }
});

app.post("/delete", function(req, res){
  const checkedItemId = req.body.checkbox;

  listItem.findByIdAndDelete(checkedItemId)
     // recive an object from listItem.findByIdAndDelete(checkedItemId)
    .then((deletedItem) => {
      if (deletedItem) {
        console.log("Successfully deleted check item.");
      } else {
        console.log("Item not found or already deleted.");
      }
    })
    .then (() => {
      res.redirect("/");
    })
    .catch((err) => {
      console.log(err);
      // Handle error if needed
      res.redirect("/");
    });
});

// Server Listening:
// app.listen(3000): Starts the server on port 3000 and logs a message to the console once it's running.
app.listen(3000, function() {
  console.log("Server running on port 3000.");
});
