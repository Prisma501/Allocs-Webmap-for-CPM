# Allocs Webmap for CPM
Patched map.js for using CPM WebApis.

A20 and lower: Replace map.js in /Mods/Allocs_WebAndMapRendering/webserver/js

A21 and higher: Replace map.js in /Mods/Allocs_WebAndMapRendering/webserver_legacy/js

Requires permission level 2000 for the specific api's in cpmcc_permissions.xml or you can create apiuser(s) for validated access to any of the apis, to be able to let them show in allocs webmap.
Set permission lower than 2000 or dont have apiuser access and the layers will not show on allocs webmap.
```xml
<?xml version="1.0" encoding="UTF-8"?>
<cpmcc_permissions>
	<apiusers>
		 <!-- <apiuser username="apiuser1" password="password1" permission_level="0" /> -->
	</apiusers>
	<permissions>
		<permission module="cpmcc.map" permission_level="0" />
		<permission module="cpmcc.createadvclaims" permission_level="0" />
		<permission module="cpmcc.getlandclaims" permission_level="0" />
		<permission module="cpmcc.getadvclaims" permission_level="0" />
		<permission module="cpmcc.getresetregions" permission_level="0" />
		<permission module="cpmcc.getplayerhomes" permission_level="0" />
		<permission module="cpmcc.getplayersonline" permission_level="0" />
		<permission module="cpmcc.getquestpois" permission_level="2000" />
		<permission module="cpmcc.getallpois" permission_level="2000" />
		<permission module="cpmcc.gettraders" permission_level="2000" />
		<permission module="cpmcc.getvehicles" permission_level="2000" />
	</permissions>
</cpmcc_permissions>
```
For accessing the apis via api user, configure one or multiple apiusers in cpmcc_permissions.xml and add:
```
?apiuser=apiuser1&password=password1
```
after the api call of your choice in map.js.

To disable/enable CPM checkboxes on allocs webmap (comment or uncomment) look for the code between:
```
// CPM Checkboxes -->
.......
// <-- CPM Checkboxes
```

The actual layer code for CPM layers can be found between:
```
//CPM Layers -->
.......
// <-- CPM Layers
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
