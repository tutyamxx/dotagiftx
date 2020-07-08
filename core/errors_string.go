// Code generated by "stringer -type=Errors -output=errors_string.go"; DO NOT EDIT.

package core

import "strconv"

func _() {
	// An "invalid array index" compiler error signifies that the constant values have changed.
	// Re-run the stringer command to generate them again.
	var x [1]struct{}
	_ = x[AuthErrNotFound-1000]
	_ = x[AuthErrRequiredID-1001]
	_ = x[AuthErrRequiredFields-1002]
	_ = x[AuthErrNoAccess-1003]
	_ = x[AuthErrLogin-1004]
	_ = x[AuthErrRefreshToken-1005]
	_ = x[CatalogErrNotFound-2200]
	_ = x[CatalogErrRequiredID-2201]
	_ = x[CatalogErrRequiredFields-2202]
	_ = x[CatalogErrInvalidStatus-2203]
	_ = x[CatalogErrNotesLimit-2204]
	_ = x[ImageErrNotFound-3000]
	_ = x[ImageErrUpload-3001]
	_ = x[ImageErrThumbnail-3002]
	_ = x[ItemErrNotFound-2000]
	_ = x[ItemErrRequiredID-2001]
	_ = x[ItemErrRequiredFields-2002]
	_ = x[ItemErrCreateItemExists-2003]
	_ = x[ItemErrImport-2004]
	_ = x[MarketErrNotFound-2100]
	_ = x[MarketErrRequiredID-2101]
	_ = x[MarketErrRequiredFields-2102]
	_ = x[MarketErrInvalidStatus-2103]
	_ = x[MarketErrNotesLimit-2104]
	_ = x[StorageUncaughtErr-100]
	_ = x[StorageMergeErr-101]
	_ = x[TrackErrNotFound-4000]
	_ = x[UserErrNotFound-1100]
	_ = x[UserErrRequiredID-1101]
	_ = x[UserErrRequiredFields-1102]
	_ = x[UserErrProfileImageDL-1103]
}

const (
	_Errors_name_0 = "StorageUncaughtErrStorageMergeErr"
	_Errors_name_1 = "AuthErrNotFoundAuthErrRequiredIDAuthErrRequiredFieldsAuthErrNoAccessAuthErrLoginAuthErrRefreshToken"
	_Errors_name_2 = "UserErrNotFoundUserErrRequiredIDUserErrRequiredFieldsUserErrProfileImageDL"
	_Errors_name_3 = "ItemErrNotFoundItemErrRequiredIDItemErrRequiredFieldsItemErrCreateItemExistsItemErrImport"
	_Errors_name_4 = "MarketErrNotFoundMarketErrRequiredIDMarketErrRequiredFieldsMarketErrInvalidStatusMarketErrNotesLimit"
	_Errors_name_5 = "CatalogErrNotFoundCatalogErrRequiredIDCatalogErrRequiredFieldsCatalogErrInvalidStatusCatalogErrNotesLimit"
	_Errors_name_6 = "ImageErrNotFoundImageErrUploadImageErrThumbnail"
	_Errors_name_7 = "TrackErrNotFound"
)

var (
	_Errors_index_0 = [...]uint8{0, 18, 33}
	_Errors_index_1 = [...]uint8{0, 15, 32, 53, 68, 80, 99}
	_Errors_index_2 = [...]uint8{0, 15, 32, 53, 74}
	_Errors_index_3 = [...]uint8{0, 15, 32, 53, 76, 89}
	_Errors_index_4 = [...]uint8{0, 17, 36, 59, 81, 100}
	_Errors_index_5 = [...]uint8{0, 18, 38, 62, 85, 105}
	_Errors_index_6 = [...]uint8{0, 16, 30, 47}
)

func (i Errors) String() string {
	switch {
	case 100 <= i && i <= 101:
		i -= 100
		return _Errors_name_0[_Errors_index_0[i]:_Errors_index_0[i+1]]
	case 1000 <= i && i <= 1005:
		i -= 1000
		return _Errors_name_1[_Errors_index_1[i]:_Errors_index_1[i+1]]
	case 1100 <= i && i <= 1103:
		i -= 1100
		return _Errors_name_2[_Errors_index_2[i]:_Errors_index_2[i+1]]
	case 2000 <= i && i <= 2004:
		i -= 2000
		return _Errors_name_3[_Errors_index_3[i]:_Errors_index_3[i+1]]
	case 2100 <= i && i <= 2104:
		i -= 2100
		return _Errors_name_4[_Errors_index_4[i]:_Errors_index_4[i+1]]
	case 2200 <= i && i <= 2204:
		i -= 2200
		return _Errors_name_5[_Errors_index_5[i]:_Errors_index_5[i+1]]
	case 3000 <= i && i <= 3002:
		i -= 3000
		return _Errors_name_6[_Errors_index_6[i]:_Errors_index_6[i+1]]
	case i == 4000:
		return _Errors_name_7
	default:
		return "Errors(" + strconv.FormatInt(int64(i), 10) + ")"
	}
}
