sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/core/Fragment",
    "sap/ui/export/Spreadsheet",
    "sap/ui/export/library",

],
    function (
        Controller,
        JSONModel,
        MessageToast,
        MessageBox,
        Fragment,
        Spreadsheet,
        exportLibrary
    ) {
        "use strict";
        var EdmType = exportLibrary.EdmType;
        return Controller.extend("com.golive.erbakir.zerbakiregitim.controller.Main", {
            onInit: function () {

                this.oDataModel = this.getOwnerComponent().getModel();
                this.oMainModel = this.getOwnerComponent().getModel("mainModel");
                var oViewJsonModel = new JSONModel(
                    {
                        busy: false,
                        // createCustomer: {
                        //     IvFirstName: "John",
                        //     IvLastName: "Wick",
                        //     IvEmail: "john.wick@com",
                        //     IvPhone: "1",
                        //     IvCity: "1",
                        //     IvCountry: "tr"
                        // }
                    }
                );
                this.getView().setModel(oViewJsonModel, "oMainViewModel");

                // Müşteri oluşturma için model
                var oCreateCustomerModel = new JSONModel({
                    IvFirstName: "John",
                    IvLastName: "Wick",
                    IvEmail: "john.wick@com",
                    IvPhone: "1",
                    IvCity: "1",
                    IvCountry: "tr"
                });
                this.getView().setModel(oCreateCustomerModel, "createCustomerModel");

                this.onGetCustomerList();

            },

            onGetCustomerList: function () {
                var that = this;
                var oModel = this.getOwnerComponent().getModel();
                // create
                // delete
                // uptade
                // oModel.read("/GetCustomerListSet",{
                // this.oDataModel.read("/GetCustomerListSet", {


                oModel.read("/GetCustomerListSet", {
                    success: function (oData, oResponse) {
                        var oResults = oData.results;

                        if (oData.results.length > 0) {
                            MessageToast.show("Veriler Getirildi");
                        }
                        else {
                            MessageBox.warning("Veri Bulunamadı");
                        }
                        this.getView().getModel("mainModel").setProperty("/customerList", oResults);
                        that.getView().getModel("oMainViewModel").setProperty("/customerList", oResults);
                    }.bind(this),
                    error: function (oError) {
                        MessageBox.error("Hata alındı");
                    }
                })

            },

            onCreateCustomer: function () {
                var that = this;

                // Model'i temizle
                // this.getView().getModel("createCustomerModel").setData({
                //     IvFirstName: "",
                //     IvLastName: "",
                //     IvEmail: "",
                //     IvPhone: "",
                //     IvCity: "",
                //     // IvCountry: ""
                // });

                this.getView().getModel("createCustomerModel").setProperty("/IvFirstName", "");
                this.getView().getModel("createCustomerModel").setProperty("/IvLastName", "");
                this.getView().getModel("createCustomerModel").setProperty("/IvEmail", "");
                this.getView().getModel("createCustomerModel").setProperty("/IvPhone", "");
                this.getView().getModel("createCustomerModel").setProperty("/IvCity", "");
                this.getView().getModel("createCustomerModel").setProperty("/IvCountry", "");
                // this.getView().getModel("oMainViewModel").setProperty("/customerList", []); 



                if (!this._oCreateCustomerDialog) {
                    Fragment.load({
                        id: this.getView().getId(),
                        name: "com.golive.erbakir.zerbakiregitim.view.fragments.CreateCustomer",
                        controller: this
                    }).then(function (oDialog) {
                        that._oCreateCustomerDialog = oDialog;
                        that.getView().addDependent(that._oCreateCustomerDialog);
                        that._oCreateCustomerDialog.open();
                        //  that.getView().setModel(that.getView().getModel("createCustomerModel"), "createCustomerModel"); // fragment içine veri setleme
                    });
                } else {
                    this._oCreateCustomerDialog.open();
                }
            },

            onSaveCustomer: function () {
                var that = this;
                var oModel = this.getOwnerComponent().getModel();
                var oCreateCustomerModel = this.getView().getModel("createCustomerModel");
                var oData = oCreateCustomerModel.getData();

                // Zorunlu alan kontrolü
                if (!oData.IvFirstName || oData.IvFirstName.trim() === "") {
                    MessageBox.error("Ad alanı zorunludur!");
                    return;
                }

                //    sap.ui.core.BusyIndicator.show(0);
                // Busy indicator'ı başlat

                this.getView().getModel("oMainViewModel").setProperty("/busy", true);

                // OData servisine POST isteği gönder
                // this.oDataModel.create("/CreateCustomerSet", oData, {
                oModel.create("/CreateCustomerSet", oData, {
                    success: function (oResponseData, oResponse) {
                        that.getView().getModel("oMainViewModel").setProperty("/busy", false);
                        // sap.ui.core.BusyIndicator.hide(0);
                        // Response'da hata mesajları var mı kontrol et
                        if (oResponseData.Type === "E") {
                            MessageBox.error("Müşteri oluştururken hata: " + oResponseData.Message);
                        } else {
                            MessageToast.show("Müşteri başarıyla oluşturuldu!");
                            that._oCreateCustomerDialog.close();
                            // Listeyi yenile
                            that.onGetCustomerList();
                        }
                    },
                    error: function (oError) {
                        that.getView().getModel("oMainViewModel").setProperty("/busy", false);

                        // sap.ui.core.BusyIndicator.hide(0);
                        var sErrorMessage = "Müşteri oluştururken hata oluştu!";
                        try {
                            var oErrorResponse = JSON.parse(oError.responseText);
                            if (oErrorResponse.error && oErrorResponse.error.message) {
                                sErrorMessage = oErrorResponse.error.message.value;
                            }
                        } catch (e) {
                            // JSON parse hatası durumunda default mesajı kullan
                        }

                        MessageBox.error(sErrorMessage);
                    }
                });
            },

            onCancelCreateCustomer: function () {
                this._oCreateCustomerDialog.close();
            },

            onDeleteCustomer: function (oEvent) {
                var that = this;

                var oSource = oEvent.getSource()
                var oContext = oSource.getBindingContext("oMainViewModel");
                var sPath = oContext.getPath();

                var oMainViewModel = this.getView().getModel("oMainViewModel");

                var oObject = oMainViewModel.getProperty(sPath);

                var sCustomerID = oObject.CustomerId;

                if (sCustomerID === "" || sCustomerID === undefined || sCustomerID === null) {
                    MessageToast.show("Customer ID Bulunamadı")
                    return
                }
                //ikinci yöntem
                if (!sCustomerID) {
                    MessageToast.show("Customer ID Bulunamadı")
                    return
                }
                // var sPath = oEvent.getSource().getBindingContext("oMainViewModel").getPath();
                var oModel = this.getOwnerComponent().getModel();
                debugger;

                sap.ui.core.BusyIndicator.show(0);
                oModel.remove("/DeleteCustomerSet('" + sCustomerID + "')", {
                    success: function (oData, oResponse) {
                        sap.ui.core.BusyIndicator.hide(0);
                        debugger
                        that.onGetCustomerList();
                    },
                    error: function (oError) {
                        debugger
                        sap.ui.core.BusyIndicator.hide(0);
                        var sErrorMessage = "Hata oluştu!";
                        try {
                            var oErrorResponse = JSON.parse(oError.responseText);
                            if (oErrorResponse.error && oErrorResponse.error.message) {
                                sErrorMessage = oErrorResponse.error.message.value;
                            }
                        } catch (e) {
                            // JSON parse hatası durumunda default mesajı kullan
                        }

                        MessageBox.error(sErrorMessage);
                    }
                })

            },
            onDisplayCustomer: function (oEvent) {

                var oTable = this.getView().byId("id_table");
                debugger
                var iSelectedIndex = oTable.getSelectedIndex();

                // if(iSelectedIndex <0){
                //    return MessageToast.show("Lütfen Müşteri listesinden seçim yapınız!")
                // }

                if (iSelectedIndex >= 0) {


                    var oContext = oTable.getContextByIndex(iSelectedIndex);
                    var oObject = oContext.getObject();
                    this.oMainModel.setProperty("/selectedCustomer", oObject)

                    var sCustomerId = oObject.CustomerId;
                    var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                    oRouter.navTo("RouteDetail", {
                        customerId: sCustomerId
                    })

                } else {
                    MessageToast.show("Lütfen Müşteri listesinden seçim yapınız!");
                    return;

                }






            },

            createColumnConfig: function () {
                var oResourceBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
                return [
                    {
                        label: oResourceBundle.getText("FirstName"),
                        property: "FirstName",
                        type: EdmType.String
                    },
                    {
                        label: oResourceBundle.getText("LastName"),
                        property: "LastName",
                        type: EdmType.String
                    },
                    {
                        label: oResourceBundle.getText("Phone"),
                        property: "Phone",
                        type: EdmType.String
                    },
                    {
                        label: oResourceBundle.getText("Email"),
                        property: "Email",
                        type: EdmType.String
                    },
                    {
                        label: oResourceBundle.getText("City"),
                        property: "City",
                        type: EdmType.String
                    },
                    {
                        label: oResourceBundle.getText("Country"),
                        property: "Country",
                        type: EdmType.String
                    }
                ];
            },


            /**
             * @function onExportToExcel
             * @description Tablodaki müşteri verilerini bir Excel dosyasına aktarır.
             * @author Ali Haydar Sayar
             * @date 2025-09-05
             */
            onExportToExcel: function () {
                var oTable = this.byId("id_table");
                var oModel = oTable.getModel("oMainViewModel");
                var aRows = oModel.getProperty("/customerList");

                if (!aRows || aRows.length === 0) {
                    MessageToast.show(this.getResourceBundle().getText("noDataToExport"));
                    return;
                }

                var aCols = this.createColumnConfig();

                var oSettings = {
                    workbook: {
                        columns: aCols
                    },
                    dataSource: aRows,
                    fileName: "MusteriListesi.xlsx",
                    worker: false // Basit senaryolarda ve CSP sorunlarını önlemek için false olarak ayarlanması önerilir
                };

                var oSheet = new Spreadsheet(oSettings);
                this.getView().setBusy(true); // Kullanıcıya işlem yapıldığını göster

                oSheet.build().then(function () {
                    MessageToast.show(this.getResourceBundle().getText("exportSuccess"));
                }.bind(this)).catch(function (sError) {
                    MessageBox.error(this.getResourceBundle().getText("exportError", [sError]));
                }.bind(this)).finally(function () {
                    this.getView().setBusy(false); // İşlem bitince busy indicator'ı kaldır
                    oSheet.destroy(); // Bellek sızıntılarını önlemek için nesneyi yok et
                }.bind(this));
            }





        });
    });