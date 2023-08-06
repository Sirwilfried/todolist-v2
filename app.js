//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const url = "mongodb://127.0.0.1:27017";


const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect(url + "/todolistDB", { useNewUrlParser: true});

const itemsSchema = new mongoose.Schema ({
  name: String
});

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item ({
  name: "Welcome to your todolist!"
});

const item2 = new Item ({
  name: "Hit the + button to add a new item."
});

const item3 = new Item ({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

async function insertItems() {
  try {
    await Item.insertMany(defaultItems);
    console.log("Succesfully logged defaultItems to db");
  } catch (error) {
    console.error(error);
  }
};

async function findItems() {
  try {
    const items = await Item.find({});
    return items;
  } catch (error) {
    console.error(error);
    return [];
  }
};

async function deleteItemById(id) {
  try {
    await Item.deleteOne({_id: id });
    } catch (error) {
      console.error(error);
    }
};

app.get("/", async (req, res) => {

      const foundItems = await findItems();
      if (foundItems.length === 0) {
        await insertItems();
        res.redirect ("/");
      } else {
        res.render("list", {listTitle: "Today", newListItems: foundItems});
      };
  });

app.get("/:customListName", async (req, res) => {
    const customListName = _.capitalize(req.params.customListName);

    try {
      const foundList = await List.findOne({name: customListName});
      if (!foundList) {
      // Create a new list
      const list = new List({
        name: customListName,
        items: defaultItems
      });
      await list.save();
      res.redirect("/" + customListName);
      } else {
      // Show an existing list
      res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      }
      } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server error" });
      }
  });

app.post("/", async (req, res) => {

  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item ({
    name: itemName
  });

  if (listName === "Today"){
    await item.save();
    res.redirect("/");
  } else {
    const foundList = await List.findOne({name: listName});
    await foundList.items.push(item);
    await foundList.save();
    res.redirect("/" + listName);
  }
});

app.post("/delete", async (req, res) => {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

try {
  if (listName === "Today") {
    await deleteItemById(checkedItemId);
    res.redirect("/");
  } else {
    await List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}});
    res.redirect("/" + listName);
    }
  } catch (error) {
  console.error(error);
  res.status(500).json({ error: "Server error" });
  }
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
