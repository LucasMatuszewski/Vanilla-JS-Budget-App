// Modules - keep similar peaces of code together in private, safety.

// data encapsulation - hide implementation details of module from outside scope. We use API to give access outside.

// Module with IIFE for data privacy (new scope, can't be access from outside)
var testModule = (function () {
  
  var x = 23;
  
  var add = function(a) {
    return x + a;
  }

  return { // only this is returned and accessible outside of IIFE:
    publicTest: function(b) {
      // console.log(add(b));
      return add(b); // we have access to add() because of closure
    }
  }

})();

// MVC = Model View Controller
// Separation of concerns - view and controller modules are separate, do different things and communicate only by Data (Model) Module


/***************************************
 * Data/budget (MODEL)
 */

var budgetController = (function () {
  
  // Function Constructors:
  var Expense = function(id, description, value) {
    this.id = id;
    this.description = description;
    this.value = value;
    this.percentage = -1; // -1 = undefined;
  };

  // Add method to Expense prototype
  Expense.prototype.calcPercentage = function(totalIncome) {
    if(totalIncome > 0) {
      this.percentage = Math.round(this.value / totalIncome * 100);
    } else {
      this.percentage = -1;
    }
  };

  // Separate function to get percentage (separation of concerns)
  Expense.prototype.getPercentage = function() {
    return this.percentage;
  };

  var Income = function(id, description, value) {
    this.id = id;
    this.description = description;
    this.value = value;
  };

  var calculateTotal = function(type){
    var sum = 0;
    data.allItems[type].forEach(function(item) {
      sum += item.value;
    });
    data.totals[type] = sum;
  }

  // Not the best data structure...:
  // var AllExpenses = [];
  // var AllIncomes = [];
  // var totalExpenses = 0;

  // Better data structure:
  var data = {
    allItems: {
      exp: [],
      inc: []
    },
    totals: {
      exp: 0,
      inc: 0
    },
    budget: 0,
    percentage: -1 // it's mean: doesn't exist
  };

  // OUR API to modify the data:
  return {
    addItem: function(type, desc, val) {
      var newItem, id;

      // we can't use array index as ID, because we could delete items and id should still be the same for each item.
      // Create a new ID (id of the last item in array + 1):
      id = data.allItems[type].length > 0 ? data.allItems[type][data.allItems[type].length - 1].id + 1 : 0;

      // Create new item based on Type:
      if(type === 'exp') {
        newItem = new Expense(id, desc, val);
      } else if (type === 'inc') {
        newItem = new Income(id, desc, val);
      }

      // add new item to our data structure:
      data.allItems[type].push(newItem);

      // return new item object:
      console.log(data);
      return newItem;
    },
    deleteItem: function(type, ID) {
      var IDs, index;

      // Map returns new array which contains only id's of items from original array:
      IDs = data.allItems[type].map((item) => {
        return item.id; 
      });
      
      // indexOf returns index of first found element or -1 if not found.
      index = IDs.indexOf(ID); // we save index of element with the same id as element we want to delete. 

      if (index !== -1) {
        data.allItems[type].splice(index, 1); // splice delete x elements of array starting from applied index
      }
    },
    calculateBudget: function() {

      // 1. Calculate total income and expenses
      
      /* 
      // MY VERSION:
      var totalExp = 0, totalInc = 0, budget = 0, percent = 0;
      data.allItems.exp.forEach((expense) => {
        totalExp += expense.value;
      })
      data.totals.exp = totalExp;
      
      data.allItems.inc.forEach((income) => {
        totalInc += income.value;
      })
      data.totals.inc = totalInc;
      */

      calculateTotal('exp');
      calculateTotal('inc');

      // 2. Calculate the budget (income - expenses)
      data.budget = data.totals.inc - data.totals.exp;

      // 3. Calculate the percentage of income that we spent
      if(data.totals.inc > 0) {
        data.percentage = Math.round(data.totals.exp / data.totals.inc * 100); // % rounded to nearest integer
      } else {
        data.percentage = -1; // not existing
      }

      // console.log('budget', data.budget, 'percent', data.percentage + '%');
    },
    calculatePercentages: function() {
      data.allItems.exp.forEach((item) => {
        item.calcPercentage(data.totals.inc);
      });
    },
    getPercentages: function() {
      var allPerc = data.allItems.exp.map(item => {
        return item.getPercentage();
      });
      return allPerc;
    },
    getBudget: function() {
      return {
        budget:     data.budget,
        totalInc:   data.totals.inc,
        totalExp:   data.totals.exp,
        percentage: data.percentage
      };
    }
  }

})();


/*************************************
 * UI (VIEW)
 */

var uiController = (function() {

  var DOMStrings = { // object to make it easier if we would like to change some class name (we have to change it only here)
    inputType:  '.add__type',
    inputDesc:  '.add__description',
    inputValue: '.add__value',
    inputBtn:   '.add__btn',
    container:  '.container',
    dateLabel:  '.budget__title--month',
    incomeContainer:    '.income__list',
    expensesContainer:  '.expenses__list',
    expensesPercent:    '.item__percentage',
    budgetValue:        '.budget__value',
    budgetIncome:       '.budget__income--value',
    budgetExpenses:     '.budget__expenses--value',
    budgetExpPercent:   '.budget__expenses--percentage',
  }

  return {
    getInput: function() {
      return {
        type: document.querySelector(DOMStrings.inputType).value, // value: inc || exp
        description: document.querySelector(DOMStrings.inputDesc).value,
        value: parseFloat(document.querySelector(DOMStrings.inputValue).value) // we get a string and convert it to a floating number
      }
      // return { type, description, value }
    },
    addListItem: function(obj, type) {
      var html, newHTML;

      // Create HTML string with placeholder text
      if (type === 'inc') {
        element = DOMStrings.incomeContainer;
        html = '<div class="item clearfix" id="inc-%id%"> <div class="item__description">%description%</div> <div class="right clearfix"> <div class="item__value">+ %value%</div> <div class="item__delete"> <button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button> </div> </div> </div>'
      } else {
        element = DOMStrings.expensesContainer;
        html = '<div class="item clearfix" id="exp-%id%"> <div class="item__description">%description%</div> <div class="right clearfix"> <div class="item__value">- %value%</div> <div class="item__percentage">21%</div> <div class="item__delete"> <button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button> </div> </div> </div>'
      }

      // Replace the placeholder text with actual data
      newHTML = html.replace('%id%', obj.id);
      newHTML = newHTML.replace('%description%', obj.description);
      newHTML = newHTML.replace('%value%', this.formatNumber2(obj.value));

      // Insert the HTML into the DOM
      // https://developer.mozilla.org/en-US/docs/Web/API/Element/insertAdjacentHTML
      document.querySelector(element).insertAdjacentHTML('beforeend', newHTML);

    },
    deleteListItem: function(id) {
      // document.getElementById(id).remove(); // DOM level 4: remove() - don't works with Internet Explorer !!!
      // https://developer.mozilla.org/pl/docs/Web/API/ChildNode/remove (added about 2013, quite new)
      // https://dzone.com/articles/removing-element-plain

      // more compatible old version:
      var element = document.getElementById(id); // selects our node to delete
      element.parentNode.removeChild(element); // go up to parent node and remove child node.
      // https://www.w3schools.com/jsref/met_node_removechild.asp
    },
    clearFields: function() {
      var fields, fieldsArr;
      // querySelectorAll returns a NodeList (not an ARRAY):
      // https://developer.mozilla.org/en-US/docs/Web/API/Document/querySelectorAll
      fields = document.querySelectorAll(DOMStrings.inputDesc + ', ' + DOMStrings.inputValue);
      // My simple method:
      // fields[0].value = "";
      // fields[1].value = "";
      // console.log(fields);

      // Convert NodeList to an Array:
      // fields.slice() won't work because it's not an Array, it's a NodeList. So we have to use slice from Array prototype:
      fieldsArr = Array.prototype.slice.call(fields); // we borrow slice method and use it on "fields" NodeList.
      // fieldsArr = Array.slice(fields); <-- it's not working! Error: slice is not a function.

      /**** IMPORTANT:
       * Now NodeList have forEach in it's prototype! So we can use it directly on fields (not on fieldsArr).
       * But it still don't have map(), join(), slice() etc.
       * 
       * To convert NodeList to array we can also use Array.from() method.
       */

      fieldsArr.forEach(function(field, index, array) { // fields.forEach() also works (NodeList have forEach prototype)
        field.value = "";
      });

      // set focus on description:
      fields[0].focus(); // Works both for fields NodeList and for fieldsArr Array.

    },
    displayBudget: function(budget) {
      // document.querySelector(DOMStrings.budgetValue).textContent = (budget.budget >= 0 && '+ ') + this.formatNumber2(budget.budget);
      document.querySelector(DOMStrings.budgetValue).textContent = this.formatNumber2(budget.budget);
      document.querySelector(DOMStrings.budgetIncome).textContent = '+ ' + this.formatNumber2(budget.totalInc);
      document.querySelector(DOMStrings.budgetExpenses).textContent = '- ' + this.formatNumber2(budget.totalExp);
      document.querySelector(DOMStrings.budgetExpPercent).textContent = budget.percentage >0 ? budget.percentage + '%' : '--%';
    },
    displayPercentages: function(percentages) {
      var fields = document.querySelectorAll(DOMStrings.expensesPercent); // nodeList (not array) with selected nodes
      // now nodeLists have forEach() method (we don't have to convert it to an Array):
      /*
      fields.forEach((field, index) => {
        field.textContent = percentages[index] + '%';
      });
      */

      // OLD METHOD WITHOUT forEach() - we can create own method for this:
      var nodeListForEach = function(list, callback) {
        for (var i = 0; i < list.length; i++) {
          callback(list[i], i);
        }
      };
      nodeListForEach(fields, function(field, index) {
        field.textContent = (percentages[index] === 0 ? '<1%' : percentages[index] + '%');
      });
    },
    formatNumber: function(num, type) {
      var numSplit, int, dec, sign;
      /** RULES:
       * + or - before number
       * exactly 2 decimal points
       * comma separating the thousands
       * 
       * 2310.4567 --> + 2,310.46
       */
      num = Math.abs(num); // returns absolute value (eg. string '-1' => 1, null => 0, 'string' => NaN, -2 => 2)
      // When we use method on primitives JS converts it to object, and they have methods in their object:
      num = num.toFixed(2); // method of number prototype to fix number of decimals, eg. 1 => 1.00, 12.234 => 12.34

      // split integer and decimals to array:
      numSplit = num.split('.');
      int = numSplit[0];
      dec = numSplit[1];

      if(int.length > 3) {
        int.substr(0, int.length - 3) + ',' + int.substr(int.length - 3, 3);
        // input: 23510 --> output: 23,510 .... WHAT ABOUT 1000000 ???? --> 1000,000
      }

      type === 'exp' ? sign = '-' : sign = '+';

      return sign + ' ' + int + dec;
    },
    formatNumber2: function(num) {
      // MY VERSION BASED ON:
      // https://stackoverflow.com/questions/2901102/how-to-print-a-number-with-commas-as-thousands-separators-in-javascript

      // return num.toLocaleString(undefined, {maximumFractionDigits: 2, minimumFractionDigits: 2}); // without currency nor local formatting
      // return num.toLocaleString('en-US', { style: 'currency', currency: 'USD' }); // with USD currency and US local formatting
      return num.toLocaleString('PL', { style: 'currency', currency: 'PLN' }); // with PLN currency and PL local formatting
    },
    displayDate: function(){
      var now, year, month;
      now = new Date(); // by default it return today date
      // var christmas = new Date(2019, 11, 25); // date of Christmas, 11 is for December, numeration starts from 0.
      year = now.getFullYear();
      month = now.getMonth()
      months = ['January', 'February', 'March', '...'];
      document.querySelector(DOMStrings.dateLabel).textContent = months[month] + ' ' + year;
    },
    displayDate2: function(){
      // NEW VERSION TO FORMAT DATES:
      var now, date;
      now = new Date(); // by default it return today date

      // date = now.toLocaleDateString('en-US'); // 2/23/2019
      date = now.toLocaleDateString(undefined, {year: 'numeric', month: 'long'}); // February 2019 or luty 2019 (based on local lang)
      document.querySelector(DOMStrings.dateLabel).textContent = date;
    },
    changeType: function() {
      var fields = document.querySelectorAll(
        DOMStrings.inputType + ',' +
        DOMStrings.inputDesc + ',' +
        DOMStrings.inputValue
      );
      fields.forEach((field) => {
        field.classList.toggle('red-focus')
      });
      // querySelectorAll - returns NodeList with all selected elements
      // querySelector - returns first selected element / one node
      document.querySelector(DOMStrings.inputBtn).classList.toggle('red');
    },
    getDOMStrings: function() {
      return DOMStrings;
    }
  }

})();


/****************************************
 * Controller (Control Model and View, and is controlled by user = takes actions from user)
 */

var controller = (function(budgetCtrl, uiCtrl) {
  
  // to make code more organized lets add function to set all event listeners:
  var setupEventListeners = function() {

    var DOM = uiCtrl.getDOMStrings();

    // on button click:
    document.querySelector(DOM.inputBtn).addEventListener('click', ctrlAddItem); // callback, we don't invoke it here, just pass a name

    // event listener on keypress (on add_value input only):
    // document.querySelector('.add__value').addEventListener('keypress', function(event) {

    // event listener on Enter (anywhere on a page) - keyCode for enter is 13
    document.addEventListener('keypress', function(event) {
      if(event.keyCode === 13 || event.which === 13) { // which is for old browsers
        console.log('enter pressed')
        ctrlAddItem();
      }
    });

    // Event delegation from delete button (which don't exist on the beginning) to div.container:
    document.querySelector(DOM.container).addEventListener('click', ctrlDeleteItem); // event object is passed to ctrlDeleteItem func.

    document.querySelector(DOM.inputType).addEventListener('change', uiCtrl.changeType);
  };


  var ctrlAddItem = function() {
    var input, newItem;
    
    // 1. get input data
    input = uiCtrl.getInput();
    console.log(input);
    
    if(input.description !== "" && !isNaN(input.value) && input.value > 0) {
      // 2. add item to the budget (data) controller
      newItem = budgetCtrl.addItem(input.type, input.description, input.value);

      // 3. add the item to the UI
      uiCtrl.addListItem(newItem, input.type);

      // 4. clear the fields
      uiCtrl.clearFields();

      // 5. calculate and update budget
      updateBudget();

      // 6. Calculate and update percentages:
      updatePercentages();
    }
  };

  var ctrlDeleteItem = function(event) {
    var itemID, splitID, type, ID;

    // when we hit delete icon, the <i> element is an event.target
    // To select parent element <div id="inc-ID"><i></div> we use DOM traversing:
    itemID = event.target.parentNode.parentNode.parentNode.parentNode.id; // go 4 parent elements up and gets ID.

    if(itemID) { // only inc-ID & exp-ID exists on our DOM, so if there is no Id it would be null

      // id is "inc-0" string. We can use split method on this string. From where we can take this method?
      // String is a primitive but JS transforms string and numbers to objects when we use methods on them.
      splitID = itemID.split('-'); // split by dash '-'. It returns array['inc', '0']
      type = splitID[0];
      ID = +splitID[1]; // it's a string so we change it to a number with + before.
      // We can convert string to number also like this: parseInt(splitID[1]);

      // 1. Delete the item form data structure
      budgetCtrl.deleteItem(type, ID);

      // 2. Delete the item from UI
      uiController.deleteListItem(itemID);

      // 3. Update and show the new budget
      updateBudget();

      // 4. Calculate and update percentages:
      updatePercentages();
    }

  };

  
  // FUNCTION TO CALCULATE AND DISPLAY ON UI (to make code DRY, we will reuse it on deleting items)
  var updateBudget = function() {
    
    // 1. calculate the budget total
    budgetCtrl.calculateBudget()

    // 2. return the budget (each function have specific task)
    var budget = budgetCtrl.getBudget();

    // 3. display the total budget on the UI
    uiCtrl.displayBudget(budget);
  }

  var updatePercentages = function() {
    // 1. Calculate percentages
    budgetCtrl.calculatePercentages();
    // 2. Read percentage from the budget controller
    var percentages = budgetCtrl.getPercentages();
    // 3. Update the UI with the new percentages
    uiCtrl.displayPercentages(percentages);
  }

  // initialization function (we can use it also to restart our app):
  return {
    init: function() {
      console.log('App has started');
      uiCtrl.displayDate2();
      uiCtrl.displayBudget({
        budget:     0,
        totalInc:   0,
        totalExp:   0,
        percentage: -1
      }); // override HTML with zero values from empty budget; (we should also change values in HTML document)
      setupEventListeners();
    }
  }
  
})(budgetController, uiController);
// budgetController from invocation () is used as argument inside IIFE, and we give this argument a name budgetCtrl to separate it


// Here we init a function:
controller.init();



/////////////////////////////////////////////////////////
// Event Bubbling - Target Element - Event Delegation //
///////////////////////////////////////////////////////
// Event on <button> object is bubbling up in a DOM to parent elements up to Root DOM element (html/document).
// Event object contains information about Target Element (e.g. button which was hit)
//
// We can catch event on main element (example: containing div) by event delegation. It's useful when:
// 1. We need to track many events on many elements (we can set one event listener on containing element)
// 2. Object we want to follow don't exist when we set event listener (income/expense which will be added in future)

// How to use parentNode property for DOM traversing.