
Search work items with the expressiveness of the work item query language.

Explore the wiql syntax on the wiql playground  
![query playground](img/playground.png)

Use the wiql editor to modify existing queries

![context menu](img/contextMenu.png) ![Results menu bar](img/resultsBar.png)

Save changes to the query when finished.  

 ![wiql dialog](img/dialog.png)

# Why?
- Access hidden wiql features
  - asof queries
  - ever contains tag
  - ever contains words
- Bulk move/copy/paste query clauses
- Easier to read queries with lots of clauses or heavily nested clauses.
- Import export queries
- Better editor load times for exceptionally large queries

# Reference 
https://docs.microsoft.com/en-us/vsts/collaborate/wiql-syntax?view=vsts


# Change Log
(04/01/18) 2.0.1 Rewrite internals, support current iteration parameter parsing and error checking  
(12/08/17) 1.7.70 Fix bug in run/format buttons on playground  
(12/06/17) 1.7.68 update version of monaco editor  
(12/03/17) 1.7.61 Add open in queries button to playground  
(10/05/17) 1.7.47 Fix issue running queries  
(09/30/17) 1.7.46 Improve completion speed  
(06/02/17) 1.7.15 Work item type descriptions when filtering on wit  
(06/01/17) 1.7.7 Detect custom identity fields as such.  
(05/30/17) 1.7.5 Use query clauses to give better hover field descriptions  
(05/29/17) 1.7.1 Filter work item type, state and tag completions based on common filters  
(05/28/17) 1.6.49 Update to accomodate changes in loading menu items  
(04/22/17) 1.6.34 Include wef fields  
(04/16/17) 1.6.22 Button on results menu bar  
(03/27/17) 1.6.22 Allowed operator issue, block field suggestions when not allowed, dialog sizing  
(03/26/17) 1.6.16 Decrease loading times  
(03/19/17) 1.6.1 Completion for: workitemtypes, states, iteration paths, area paths, tags  
Typechecking comparison operator completion  
(03/16/17) 1.5.6 Updating wiq formatting  
(03/15/17) 1.5.1 Adds import and export buttons to editor  
Value completion of system identity fields  
Only show valid field types for field to field comparisons  
Allow saving of new queries  
(02/10/17) 1.4.14 Adds missing 'Ever' field operator  
(02/09/17) 1.4.8 Fixes link bug in older tfs installations  
Updates keybindings on results pane  
(02/08/17) 1.4.1 Show type of variables and fields on hover  
Changes url generation  
(01/30/17) 1.3.1 Removing noise from autocomplete  
(01/08/17) 1.2.1 Adds playground buttons  
Feedback links  
More syntax checking in link queries  
(12/25/16) 1.1.1 Adds support for one hop and recursive query types  
(12/17/16) 1.0.81 Patches bug type checking  
(12/14/16) 1.0.78 Patches on prem bug saving queries  
(12/08/16) 1.0.5 Changes syntax highlighting. Disclaimer about query types that are supported.  
(12/07/16) 1.0.1 Initial Release
