# Allocs Webmap for CPM
Patched map.js for using CPM WebApis

Requires permission level 2000 for the specific api's in cpmcc_permissions.xml to be able to let them show in allocs webmap.
Set permission lower than 2000 and the layers will not show on allocs webmap.
```
<permission module="cpmcc.map" permission_level="0" />
<permission module="cpmcc.createadvclaims" permission_level="0" />
<permission module="cpmcc.getlandclaims" permission_level="0" />
<permission module="cpmcc.getadvclaims" permission_level="0" />
<permission module="cpmcc.getresetregions" permission_level="2000" />
<permission module="cpmcc.getplayerhomes" permission_level="0" />
<permission module="cpmcc.getplayersonline" permission_level="0" />
<permission module="cpmcc.getquestpois" permission_level="2000" />
<permission module="cpmcc.getallpois" permission_level="2000" />
<permission module="cpmcc.gettraders" permission_level="2000" />
```

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
* All POI's
* Quest POI's
* Quest POI's with bed/lcb (shielded behind viewlandclaims permission(allocs))
* All CPM's advanced claims (11) (shielded behind viewallclaims permission(allocs))
* Player beds (shielded behind viewallclaims permission(allocs))
