# Allocs Webmap for PrismaCore
Patched map.js for using PrismaCore WebApis.

A20 and lower: Replace map.js in /Mods/Allocs_WebAndMapRendering/webserver/js

A21 and higher: Replace map.js in /Mods/Allocs_WebAndMapRendering/webserver_legacy/js

To configure connection to CPM's WebAPI, make sure the port CPM's WebUI is running on, is filled in map.js (first line) with 'var ClaimCreatorWebUiPort = 11111;'

Requires permission level 2000 for the specific api's in cpmcc_permissions.xml or you can create apiuser(s) for validated access to any of the apis, to be able to let them show in allocs webmap.
Set permission lower than 2000 or dont have apiuser access and the layers will not show on allocs webmap.
```xml
<?xml version="1.0" encoding="UTF-8"?>
<cpmcc_permissions>
	<apiusers>
		 <!-- <apiuser username="apiuser1" password="password1" permission_level="0" /> -->
	</apiusers>
	<permissions>
		<permission module="ClaimCreator.map" permission_level="0" />
		<permission module="ClaimCreator.createadvclaims" permission_level="0" />
		<permission module="ClaimCreator.getlandclaims" permission_level="0" />
		<permission module="ClaimCreator.getadvclaims" permission_level="0" />
		<permission module="ClaimCreator.getresetregions" permission_level="0" />
		<permission module="ClaimCreator.getplayerhomes" permission_level="0" />
		<permission module="ClaimCreator.getplayersonline" permission_level="0" />
		<permission module="ClaimCreator.getquestpois" permission_level="2000" />
		<permission module="ClaimCreator.getallpois" permission_level="2000" />
		<permission module="ClaimCreator.gettraders" permission_level="2000" />
		<permission module="ClaimCreator.getvehicles" permission_level="2000" />
	</permissions>
</cpmcc_permissions>
```
For accessing the apis via api user, configure one or multiple apiusers in ClaimCreator_permissions.xml and add:
```
?apiuser=apiuser1&password=password1
```
after the api call of your choice in map.js.

To disable/enable PrismaCore checkboxes on allocs webmap (comment or uncomment) look for the code between:
```
// PrismaCore Checkboxes -->
.......
// <-- PrismaCore Checkboxes
```

The actual layer code for PrismaCore layers can be found between:
```
//PrismaCore Layers -->
.......
// <-- PrismaCore Layers
```

This version contains checkboxes and layers for:
* Reset Regions
* Traders
* Vehicles
* All POI's
* Quest POI's
* Quest POI's with bed/lcb (shielded behind viewlandclaims permission(allocs))
* All CPM's advanced claims (15) (shielded behind viewallclaims permission(allocs))
* Player beds (shielded behind viewallclaims permission(allocs))
