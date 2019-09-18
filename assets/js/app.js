const floorWidth = grids[0].length;
const floorHeight = grids.length;

let start = {};
let productLocations = [];
let selectedProducts = [];
let robotStart = false;
let productStart = false;

let nodesVisited = [];
let nodesLevel = {};
let productsFind = 0;
let prodCount;
let productsPath = [];
let robotRoutes = [];
let productsPathCells = [];
let previousRoute = [];
let nodeCount = 0;
let prevNodeCount = 0;

let bestTourWeight;
let bestTour;

let arrowCount;

window.onload = function() {
    getGrids();
}

/*
    Create Grid Table O(n) = col * rows
 */
const getGrids = () => {
    let gridsData = "<table border='1' class='grid-table'><tbody>";

    for (let col in grids) {
        for (let row in grids[col]) {
            if(row === 0) {
                gridsData += "<tr>";
            }
            let cellId = row.toString() + col.toString();
            if(grids[col][row].robot_start === 1) {
                if (robotStart === true) {
                    gridsData += "<td class='grid-cell' id=" + cellId + " style='background-color: red;'>Multiple starting points\n</td>";
                    robotStart = false;
                } else {
                    start = {id: 0, name: "start", x: parseInt(row), y: parseInt(col)};
                    robotStart = true;
                    gridsData += "<td class='grid-cell' id=" + cellId + " style='background-color: green;'></td>";
                }

            } else if(grids[col][row].path === 0) {
                gridsData += "<td class='grid-cell' id=" + cellId + " style='background-color: darkgray;'></td>";
            } else {
                gridsData += "<td class='grid-cell' id=" + cellId + " style='background-color: white;'></td>";
            }
            if(parseInt(row) === floorWidth-1) {
                gridsData += "</tr>";
            }
        }

    }

    gridsData += "</tbody></table>";
    document.getElementById("grids").innerHTML = gridsData;

    placeProducts()
};

/*
    Place products inside menu and grid O(n) = P*S (num of products) * (num of stores)
 */
const placeProducts = () => {
    let productsData = "<select class='custom-select' id='productData' multiple onchange='getSelectedProducts()'><option value=''>Select Products</option>";
    resetCart();
    for(let item in products) {
        let cellId = products[item].x.toString() + products[item].y.toString();
        let disabled = "";
        let gridStartEnabled = (grids[start.y][start.x].path === 1) ? true : false;
        if (grids[products[item].y][products[item].x].path === 0 || !gridStartEnabled || robotStart === false) {
            disabled = "disabled=";
            document.getElementById(start.x.toString() + start.y.toString()).innerHTML = "Enable to start";
            document.getElementById(start.x.toString() + start.y.toString()).style.backgroundColor = "darkgray";
        } else {
            document.getElementById(cellId).innerHTML = products[item].name;
            if(grids[products[item].y][products[item].x].robot_start === 0) {
                document.getElementById(cellId).style.backgroundColor = "blue";
                document.getElementById(cellId).style.color = "white";
            } else {
                start.name = products[item].name;
                start.price = products[item].price;
                productStart = true;
            }
        }
        var storeName = getStoreName(products[item].store_id);
        productsData += "<option " + disabled + "value='" + item + "'>" + products[item].name + " ( "+ products[item].price + " MYR ) ( " + storeName + " )</option>";
    }
    productsData += "</select>";
    document.getElementById("products").innerHTML = productsData;
};

const getStoreName = storeId => {
    let storeName = "";
    for (let s=0; s < stores.length; s++) {
        if(stores[s].id === storeId) {
            storeName =  stores[s].name;
            break;
        }
    }
    return storeName;
};

const resetCart = () => {
    document.getElementById("items").innerHTML = "";
    document.getElementById("price").innerHTML = "";
    document.getElementById("time").innerHTML = "";
    document.querySelectorAll('.arrow-image').forEach(e => e.remove());
};

/*
    Get Selected Products O(n) = 2 SP (selected products)
 */
const getSelectedProducts = () => {
    let select = document.getElementById("productData");
    let options = select && select.options;
    let opt;
    let selectedItems = [];
    let totalPrice = 0;
    productLocations = [];
    selectedProducts = [];
    selectedProducts.length = 0;
    resetCart();
    selectedProducts.push(start);
    if (productStart) {
        selectedItems.push(start.name);
        totalPrice += start.price;
    }

    for (let i=0; i <options.length; i++) {
        opt = options[i];

        if (opt.selected) {
            var newSelectedProduct = products[opt.value];
            if(newSelectedProduct.x !== start.x || newSelectedProduct.y !== start.y) {
                selectedProducts.push(newSelectedProduct);
                selectedItems.push(newSelectedProduct.name);
                totalPrice += newSelectedProduct.price;
            }
        }
    }
    for(var s in selectedProducts) {
        productLocations.push(selectedProducts[s].x.toString() + selectedProducts[s].y.toString());
    }

    if(selectedProducts.length > 1 || productStart) {
        document.getElementById("items").innerHTML = selectedItems.join(", ");
        document.getElementById("price").innerHTML = totalPrice + " MYR";
        document.getElementById("time").innerHTML = "00:00";
        if(selectedProducts.length > 1) {
            findProductsPath();
        }
    }
};

const findProductsPath = () => {
    productsPath = [];
    productsPath.length = 0;
    for(prodCount = 0; prodCount < selectedProducts.length; prodCount++) {
        nodesVisited = [];
        nodesVisited.length = 0;
        nodesLevel = {};
        productsFind = 0;
        robotRoutes = [];
        robotRoutes.length = 0;
        productsPath[prodCount] = [];
        productsPath[prodCount][prodCount] = 0;
        productsPathCells[prodCount] = [];
        productsPathCells[prodCount][prodCount] = [];
        previousRoute = [];
        previousRoute.length = 0;
        nodeCount = 0;
        prevNodeCount = 0;
        let prodLoc = selectedProducts[prodCount].x.toString() + selectedProducts[prodCount].y.toString();
        nodesVisited.push(prodLoc);
        nodesLevel[prodLoc] = 0;
        for(nodeCount = 0; nodeCount < nodesVisited.length; nodeCount++) {
            if(productsFind === selectedProducts.length - 1) {
                break;
            }
            let x = parseInt(nodesVisited[nodeCount].charAt(0));
            let y = parseInt(nodesVisited[nodeCount].charAt(1));
            checkNearNodes(x, y, nodesLevel[nodesVisited[nodeCount]]);
        }
    }

    shortestPathDynamic();
};

const checkNearNodes = (x, y, level) => {
    if (x == 0  && y == 0) {
        addVisitedNode((x+1), y, level, x, y);
        addVisitedNode((x), (y+1), level, x, y);
    } else if(x == floorWidth - 1 && y == 0) {
        addVisitedNode((x-1), y, level, x, y);
        addVisitedNode((x), (y+1), level, x, y);
    } else if(x == floorWidth - 1 && y < floorHeight - 1) {
        addVisitedNode((x), (y-1), level, x, y);
        addVisitedNode((x-1), y, level, x, y);
        addVisitedNode((x), (y+1), level, x, y);
    } else if(x == 0 && y == floorHeight - 1) {
        addVisitedNode(x, (y-1), level, x, y);
        addVisitedNode((x+1), (y), level, x, y);
    } else if(x == 0 && y < floorHeight - 1) {
        addVisitedNode(x, (y-1), level, x, y);
        addVisitedNode((x+1), y, level, x, y);
        addVisitedNode(x, (y+1), level, x, y);
    } else if(x == floorWidth - 1 && y == floorHeight - 1) {
        addVisitedNode((x-1), (y), level, x, y);
        addVisitedNode(x, (y-1), level, x, y);
    } else if(x < floorWidth - 1 && y == 0) {
        addVisitedNode((x-1), y, level, x, y);
        addVisitedNode((x), (y+1), level, x, y);
        addVisitedNode((x+1), y, level, x, y);
    } else if(x < floorWidth - 1 && y == floorHeight - 1) {
        addVisitedNode((x-1), (y), level, x, y);
        addVisitedNode(x, (y-1), level, x, y);
        addVisitedNode((x+1), (y), level, x, y);
    } else {
        addVisitedNode((x-1), y, level, x, y);
        addVisitedNode(x, (y-1), level, x, y);
        addVisitedNode((x+1), y, level, x, y);
        addVisitedNode((x), (y+1), level, x, y);
    }
    prevNodeCount = nodeCount;
};

const addVisitedNode = (x, y, level, parentX, parentY) => {
    let loc = x.toString() + y.toString();
    let parentLoc = parentX.toString() + parentY.toString();
    if(nodesLevel[loc] === undefined && grids[y][x].path === 1) {
        nodesVisited.push(loc);
        nodesLevel[loc] = parseInt(level + 1);
        let currRoute = addRobotRoutes(loc, parentLoc);
        checkProductLocation(loc, currRoute);
    }
};

const addRobotRoutes = (loc, parentLoc) => {
    let parentRoute = [];
    for (let r = 0; r < robotRoutes.length; r++) {
        if (robotRoutes[r].indexOf(parentLoc) > -1) {
            parentRoute = robotRoutes[r].slice();
            break;
        }
    }
    if(parentRoute.length === 0) {
        parentRoute = [parentLoc, loc];
        robotRoutes.push(parentRoute);
    } else {
        if(previousRoute.indexOf(parentLoc) > -1 && prevNodeCount === nodeCount) {
            parentRoute.splice(parentRoute.length-1, 1, loc);
        } else {
            parentRoute.push(loc);
        }
        robotRoutes.push(parentRoute);
    }
    previousRoute = parentRoute;
    return robotRoutes.length - 1;
};

const checkProductLocation = (loc, currRoute) => {
    var prodId = productLocations.indexOf(loc);
    if (prodId > -1) {
        productsPath[prodCount][prodId] = nodesLevel[loc];
        productsPathCells[prodCount][prodId] = robotRoutes[currRoute];
        productsFind++;
    }
};

/* Find shortest path. Memory requirement is
    * O(SP * 2^SP) Selected Products
*/
const shortestPathDynamic = () => {
    let nextSet = new Array();
    let bestPath = new Array();
    let bestLength = Infinity;
    bestTourWeight = 0;
    bestTour = [];
    bestTour.length = 0;
    /* Finds the next integer that has num bits set to 1.
     */
    function nextSetOf(num,nextSet,tspCount) {
        let count = 0;
        let ret = 0;
        for (let i = 0; i < tspCount; ++i) {
            count += nextSet[i];
        }
        if (count < num) {
            for (let i = 0; i < num; ++i) {
                nextSet[i] = 1;
            }
            for (let i = num; i < tspCount; ++i) {
                nextSet[i] = 0;
            }
        } else {
            // Find first 1
            let firstOne = -1;
            for (let i = 0; i < tspCount; ++i) {
                if (nextSet[i]) {
                    firstOne = i;
                    break;
                }
            }
            // Find first 0 greater than firstOne
            let firstZero = -1;
            for (let i = firstOne + 1; i < tspCount; ++i) {
                if (!nextSet[i]) {
                    firstZero = i;
                    break;
                }
            }
            if (firstZero < 0) {
                return -1;
            }
            // Increment the first zero with ones behind it
            nextSet[firstZero] = 1;
            // Set the part behind that one to its lowest possible value
            for (let i = 0; i < firstZero - firstOne - 1; ++i) {
                nextSet[i] = 1;
            }
            for (let i = firstZero - firstOne - 1; i < firstZero; ++i) {
                nextSet[i] = 0;
            }
        }
        // Return the index for this set
        for (let i = 0; i < tspCount; ++i) {
            ret += (nextSet[i]<<i);
        }
        return ret;
    };
    let numCombos = 1<<productsPath.length;
    let C = new Array();
    let parent = new Array();
    for (let i = 0; i < numCombos; ++i) {
        C[i] = new Array();
        parent[i] = new Array();
        for (let j = 0; j < productsPath.length; ++j) {
            C[i][j] = 0.0;
            parent[i][j] = 0;
        }
    }
    for (let k = 1; k < productsPath.length; ++k) {
        let index = 1 + (1<<k);
        C[index][k] = productsPath[0][k];
    }
    let index;
    for (let s = 3; s <= productsPath.length; ++s) {
        for (let i = 0; i < productsPath.length; ++i) {
            nextSet[i] = 0;
        }
        index = nextSetOf(s,nextSet,productsPath.length);
        while (index >= 0) {
            for (let k = 1; k < productsPath.length; ++k) {
                if (nextSet[k]) {
                    let prevIndex = index - (1<<k);
                    C[index][k] = Infinity;
                    for (let m = 1; m < productsPath.length; ++m) {
                        if (nextSet[m] && m != k) {
                            if (C[prevIndex][m] + productsPath[m][k] < C[index][k]) {
                                C[index][k] = C[prevIndex][m] + productsPath[m][k];
                                parent[index][k] = m;
                            }
                        }
                    }
                }
            }
            index = nextSetOf(s,nextSet,productsPath.length);
        }
    }
    for (let i = 0; i < productsPath.length; ++i) {
        bestPath[i] = 0;
    }
    index = (1<<productsPath.length)-1;

    //mode roundtrip:
    let currNode = -1;
    bestPath[productsPath.length] = 0;
    for (let i = 1; i < productsPath.length; ++i) {
        if (C[index][i] + productsPath[i][0] < bestLength) {
            bestLength = C[index][i] + productsPath[i][0];
            currNode = i;
        }
    }
    bestPath[productsPath.length-1] = currNode;

    for (let i = productsPath.length - 1; i > 0; --i) {
        currNode = parent[index][currNode];
        index -= (1<<bestPath[i]);
        bestPath[i-1] = currNode;
    }


    bestTourWeight = bestLength;
    bestTour = bestPath;
    document.getElementById("time").innerHTML = bestTourWeight.toString().toHHMMSS();
    startOrder();
};

/*
    Show path with arrows on grid
 */
const startOrder = () => {
    arrowCount = 1;
    for (let path = 0; path < bestTour.length; path++) {
        if (bestTour[path+1] !== undefined) {
            let currPath = productsPathCells[bestTour[path]][bestTour[path+1]];
            for(let cpath = 0; cpath < currPath.length; cpath++) {
                if (currPath[cpath+1] !== undefined) {
                    document.getElementById(currPath[cpath]).innerHTML += getArrow(parseInt(currPath[cpath].charAt(0)), parseInt(currPath[cpath].charAt(1)), parseInt(currPath[cpath+1].charAt(0)), parseInt(currPath[cpath+1].charAt(1)));
                }
            }
        }
    }
};

const getArrow = (x1, y1, x2, y2) => {
    let arrowImg = "";
    if (x2 > x1 && y2 === y1) {
        arrowImg += "<p class='arrow-image'>" + arrowCount + ") <img src='assets/images/right-arrow.png' width='12px' height='12px' /></p>";
    } else if (x2 < x1 && y2 === y1) {
        arrowImg += "<p class='arrow-image'>" + arrowCount + ") <img src='assets/images/left-arrow.png' width='12px' height='12px' /></p>";
    } else if (x2 === x1 && y2 > y1) {
        arrowImg += "<p class='arrow-image'>" + arrowCount + ") <img src='assets/images/down-arrow.png' width='12px' height='12px' /></p>";
    }  else if (x2 === x1 && y2 < y1) {
        arrowImg += "<p class='arrow-image'>" + arrowCount + ") <img src='assets/images/up-arrow.png' width='12px' height='12px' /></p>";
    }
    arrowCount++;
    return arrowImg;
};

String.prototype.toHHMMSS = function () {
    var sec_num = parseInt(this, 10); // don't forget the second param
    var hours   = Math.floor(sec_num / 3600);
    var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    var seconds = sec_num - (hours * 3600) - (minutes * 60);

    if (hours   < 10) {hours   = "0"+hours;}
    if (minutes < 10) {minutes = "0"+minutes;}
    if (seconds < 10) {seconds = "0"+seconds;}
    return minutes +':'+ seconds;
}
