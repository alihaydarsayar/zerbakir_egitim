sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/core/Fragment",
    "com/golive/erbakir/zerbakiregitim/model/formatter",
    "sap/ui/core/format/DateFormat",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/export/Spreadsheet",
    "sap/ui/export/library",
],
    function (
        Controller,
        JSONModel,
        MessageToast,
        MessageBox,
        Fragment,
        formatter,
        DateFormat,
        Filter,
        FilterOperator,
        Spreadsheet,
        exportLibrary
    ) {
        "use strict";

        var EdmType = exportLibrary.EdmType;

        return Controller.extend("com.golive.erbakir.zerbakiregitim.controller.CustomerDetail", {
            formatter: formatter,
            onInit: function () {
                this.oDataModel = this.getOwnerComponent().getModel();
                this.oMainModel = this.getOwnerComponent().getModel("mainModel");
                var oViewJsonModel = new JSONModel(
                    {
                        busy: false,
                        title: ""
                    }
                );
                this.getView().setModel(oViewJsonModel, "oDetailViewModel");

                var oCustomerDetailModel = new JSONModel({
                    // CustomerDetail: {

                    // },
                    City: "",
                    Country: "",
                    CustomerId: "",
                    Email: "",
                    Field: "",
                    FirstName: "",
                    Id: "",
                    IvCustomerId: "",
                    LastName: "",
                    Message: "",
                    Type: ""
                });
                this.getView().setModel(oCustomerDetailModel, "customerDetailModel");


                // Sipariş oluşturma için model
                var oCreateSalesOrderModel = new JSONModel({
                    CustomerId: "",
                    Vbeln: "",
                    OrderDate: new Date(),
                    Description: "",
                    CreateSalesOrderItemSet: [],
                    CreateSalesOrderExCreatedSet: [],
                    CreateSalesOrderExMsgSet: []
                });
                this.getView().setModel(oCreateSalesOrderModel, "createSalesOrderModel");

                var oOrderListModel = new JSONModel({
                    orders: []
                });
                this.getView().setModel(oOrderListModel, "orderListModel");

                var oDialogModel = new JSONModel({
                    title: "",
                    items: []
                });
                this.getView().setModel(oDialogModel, "dialogModel");


                var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                oRouter.getRoute("RouteDetail").attachPatternMatched(this._onRouteMatched, this);
            },

            _onRouteMatched: function (oEvent) {

                var mArguments = oEvent.getParameter("arguments");
                var sCustomerID = mArguments.customerId;


                var oModel = this.getOwnerComponent().getModel();
                var oRouter = sap.ui.core.UIComponent.getRouterFor(this);


                sap.ui.core.BusyIndicator.show(0);
                oModel.read("/GetCustomerDetailSet('" + sCustomerID + "')", {
                    success: function (oData, oResponse) {
                        sap.ui.core.BusyIndicator.hide(0);

                        var sType = oData.Type;
                        var sMsg = oData.Message;

                        if (sType === "S") {
                            this.getView().getModel("customerDetailModel").setData(oData);
                            this.getView().getModel("oDetailViewModel").setProperty("/title", oData.FirstName + " " + oData.LastName);
                            MessageToast.show(sMsg);
                            // this._fetchCustomerOrders(sCustomerID);
                        }
                        // else if( sType ==="W"){
                        //     //
                        // } 
                        else {
                            MessageBox.error(sMsg);
                            oRouter.navTo("RouteMain", {
                            })
                        }




                        // this.getView().getModel("customerDetailModel").setProperty("/CustomerDetail", oData);

                    }.bind(this),
                    error: function (oError) {

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

                this._fetchCustomerOrders(sCustomerID);
            },


            onCreateSalesOrder: function () {
                var that = this;

                // Model'i temizle ve varsayılan değerleri set et
                var oCreateSalesOrderModel = this.getView().getModel("createSalesOrderModel");
                var sCustomerId = this.getView().getModel("customerDetailModel").getProperty("/CustomerId");

                oCreateSalesOrderModel.setData({
                    CustomerId: sCustomerId,
                    Vbeln: "",
                    OrderDate: new Date(),
                    Description: "",
                    CreateSalesOrderItemSet: [],
                    CreateSalesOrderExCreatedSet: [],
                    CreateSalesOrderExMsgSet: []
                });

                if (!this._oCreateSalesOrderDialog) {
                    Fragment.load({
                        id: this.getView().getId(),
                        name: "com.golive.erbakir.zerbakiregitim.view.fragments.CreateSalesOrder",
                        controller: this
                    }).then(function (oDialog) {
                        that._oCreateSalesOrderDialog = oDialog;
                        that.getView().addDependent(that._oCreateSalesOrderDialog);
                        that._oCreateSalesOrderDialog.open();
                    });
                } else {
                    this._oCreateSalesOrderDialog.open();
                }
            },

            onAddOrderItem: function () {
                var oCreateSalesOrderModel = this.getView().getModel("createSalesOrderModel");
                var aItems = oCreateSalesOrderModel.getProperty("/CreateSalesOrderItemSet");

                // Yeni sıra numarası hesapla (010, 020, 030, ...)
                var iNextItemNumber = (aItems.length + 1) * 10;
                var sNextItemNumber = iNextItemNumber.toString().padStart(3, '0');

                var oNewItem = {
                    Vbeln: "",
                    Posnr: sNextItemNumber,
                    ProductId: "",
                    Quantity: "1.000"
                };

                aItems.push(oNewItem);
                oCreateSalesOrderModel.setProperty("/CreateSalesOrderItemSet", aItems);
            },

            onDeleteOrderItem: function (oEvent) {
                var oList = oEvent.getSource();
                var oItem = oEvent.getParameter("listItem");
                var oContext = oItem.getBindingContext("createSalesOrderModel");
                var sPath = oContext.getPath();

                var oCreateSalesOrderModel = this.getView().getModel("createSalesOrderModel");
                var aItems = oCreateSalesOrderModel.getProperty("/CreateSalesOrderItemSet");
                var iIndex = parseInt(sPath.split("/")[2]);

                aItems.splice(iIndex, 1);
                oCreateSalesOrderModel.setProperty("/CreateSalesOrderItemSet", aItems);
            },

            onSaveCreateSalesOrder: function () {
                var that = this;
                var oModel = this.getOwnerComponent().getModel();
                var oCreateSalesOrderModel = this.getView().getModel("createSalesOrderModel");
                var oData = oCreateSalesOrderModel.getData();

                // Zorunlu alan kontrolü
                if (!oData.CustomerId || oData.CustomerId.trim() === "") {
                    MessageBox.error("Müşteri ID zorunludur!");
                    return;
                }

                if (!oData.CreateSalesOrderItemSet || oData.CreateSalesOrderItemSet.length === 0) {
                    MessageBox.error("En az bir sipariş kalemi eklemelisiniz!");
                    return;
                }

                // Sipariş kalemlerini kontrol et
                for (var i = 0; i < oData.CreateSalesOrderItemSet.length; i++) {
                    var oItem = oData.CreateSalesOrderItemSet[i];
                    if (!oItem.ProductId || oItem.ProductId.trim() === "") {
                        MessageBox.error("Tüm sipariş kalemleri için ürün ID'si zorunludur!");
                        return;
                    }
                    if (!oItem.Quantity || parseFloat(oItem.Quantity) <= 0) {
                        MessageBox.error("Tüm sipariş kalemleri için geçerli bir miktar girilmelidir!");
                        return;
                    }
                }

                // Tarihi ISO formatına çevir
                var oDateFormat = DateFormat.getDateTimeInstance({
                    pattern: "yyyy-MM-ddTHH:mm:ss"
                });

                if (oData.OrderDate) {
                    oData.OrderDate = oDateFormat.format(new Date(oData.OrderDate));
                }

                var oItems = oCreateSalesOrderModel.getProperty("/CreateSalesOrderItemSet")
                var CreateSalesOrderItemSet = oItems.map(function (item) {
                    return {
                        Vbeln: "",
                        Posnr: item.Posnr,
                        ProductId: item.ProductId,
                        Quantity: item.Quantity
                    }
                })


                var oEntry = {
                    CustomerId: oCreateSalesOrderModel.getProperty("/CustomerId"),
                    Vbeln: "",
                    OrderDate: oDateFormat.format(new Date(oCreateSalesOrderModel.getProperty("/OrderDate"))),
                    Description: oCreateSalesOrderModel.getProperty("/Description"),
                    CreateSalesOrderItemSet: CreateSalesOrderItemSet,
                    CreateSalesOrderExCreatedSet: [],
                    CreateSalesOrderExMsgSet: []
                }


                debugger

                this.getView().getModel("oDetailViewModel").setProperty("/busy", true);

                // OData servisine POST isteği gönder
                // oModel.create("/CreateSalesOrderSet", oData, {
                oModel.create("/CreateSalesOrderSet", oEntry, {
                    success: function (oResponseData, oResponse) {
                        // that.getView().getModel("oDetailViewModel").setProperty("/busy", false);

                        // // Response'da hata mesajları var mı kontrol et
                        // if (oResponseData.CreateSalesOrderExMsgSet && oResponseData.CreateSalesOrderExMsgSet.length > 0) {
                        //     var aErrorMessages = oResponseData.CreateSalesOrderExMsgSet.filter(function (msg) {
                        //         return msg.Type === "E";
                        //     });

                        //     if (aErrorMessages.length > 0) {
                        //         MessageBox.error("Sipariş oluştururken hata: " + aErrorMessages[0].Message);
                        //         return;
                        //     }
                        // }

                        // MessageToast.show("Sipariş başarıyla oluşturuldu! Sipariş No: " + (oResponseData.Vbeln || ""));
                        // that._oCreateSalesOrderDialog.close();

                        that.getView().getModel("oDetailViewModel").setProperty("/busy", false);

                        var sCreatedOrderNumber = "";
                        var sSuccessMessage = "";
                        var bHasError = false;

                        // CreateSalesOrderExMsgSet içindeki mesajları kontrol et
                        if (oResponseData.CreateSalesOrderExMsgSet && oResponseData.CreateSalesOrderExMsgSet.results && oResponseData.CreateSalesOrderExMsgSet.results.length > 0) {
                            var aMessages = oResponseData.CreateSalesOrderExMsgSet.results;

                            // Hata mesajları var mı kontrol et
                            var aErrorMessages = aMessages.filter(function (msg) {
                                return msg.Type === "E";
                            });

                            if (aErrorMessages.length > 0) {
                                MessageBox.error("Sipariş oluştururken hata: " + aErrorMessages[0].Message);
                                bHasError = true;
                                return;
                            }

                            // Başarı mesajını al
                            var aSuccessMessages = aMessages.filter(function (msg) {
                                return msg.Type === "S";
                            });

                            if (aSuccessMessages.length > 0) {
                                sSuccessMessage = aSuccessMessages[0].Message;
                            }
                        }

                        // CreateSalesOrderExCreatedSet içinden gerçek sipariş numarasını al
                        if (oResponseData.CreateSalesOrderExCreatedSet && oResponseData.CreateSalesOrderExCreatedSet.results && oResponseData.CreateSalesOrderExCreatedSet.results.length > 0) {
                            sCreatedOrderNumber = oResponseData.CreateSalesOrderExCreatedSet.results[0].Vbeln;
                        }

                        if (!bHasError) {
                            // Başarı mesajını göster
                            if (sSuccessMessage) {
                                MessageToast.show(sSuccessMessage);
                            } else if (sCreatedOrderNumber) {
                                MessageToast.show("Sipariş başarıyla oluşturuldu! Sipariş No: " + sCreatedOrderNumber);
                            } else {
                                MessageToast.show("Sipariş başarıyla oluşturuldu!");
                            }

                            that._oCreateSalesOrderDialog.close();
                        }
                    },
                    error: function (oError) {
                        that.getView().getModel("oDetailViewModel").setProperty("/busy", false);

                        var sErrorMessage = "Sipariş oluştururken hata oluştu!";
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

            onCancelCreateSalesOrder: function () {
                this._oCreateSalesOrderDialog.close();
            },


            _fetchCustomerOrders: function (sCustomerID) {
                var oDetailViewModel = this.getView().getModel("oDetailViewModel");
                var oOrderListModel = this.getView().getModel("orderListModel");

                oDetailViewModel.setProperty("/orderListBusy", true);

                var aFilters = [
                    new Filter("IvCustomerId", FilterOperator.EQ, sCustomerID),
                    //    new Filter("IvCustomerId", FilterOperator.EQ, sCustomerID), // diğer filtreleri bu şekilde ekliyoruz
                ];

                this.oDataModel.read("/GetOrderListSet", {
                    filters: aFilters,
                    urlParameters: {
                        "$expand": "GetOrderListItemSet"
                    },
                    success: function (oData) {
                        oDetailViewModel.setProperty("/orderListBusy", false);
                        oOrderListModel.setProperty("/orders", oData.results);
                        oDetailViewModel.setProperty("/orderCount", oData.results.length);
                        // İlk sipariş başarılı mesajını göster, tekrar edenleri gösterme
                        if (oData.results.length > 0 && oData.results[0].Message) {
                            MessageToast.show(oData.results[0].Message);
                        }
                    }.bind(this),
                    error: function (oError) {
                        oDetailViewModel.setProperty("/orderListBusy", false);
                        oOrderListModel.setProperty("/orders", []);
                        oDetailViewModel.setProperty("/orderCount", 0);
                        var sErrorMessage = "Siparişler getirilirken bir hata oluştu!";
                        try {
                            var oErrorResponse = JSON.parse(oError.responseText);
                            if (oErrorResponse.error && oErrorResponse.error.message) {
                                sErrorMessage = oErrorResponse.error.message.value;
                            }
                        } catch (e) {
                            // Hata mesajı parse edilemezse varsayılan mesaj kullanılır.
                        }
                        MessageBox.error(sErrorMessage);
                    }.bind(this)
                });
            },

            /**
                        * Kullanıcı listeden bir siparişe tıkladığında tetiklenir.
                        * Sipariş kalemlerini gösteren dialog'u açar.
                        * @param {sap.ui.base.Event} oEvent Press olayı
                        * @public
                        */
            onOrderPress: function (oEvent) {
                var oSelectedItem = oEvent.getSource();
                var oContext = oSelectedItem.getBindingContext("orderListModel");
                var oSelectedOrder = oContext.getObject();
                var that = this;
                var oDialogModel = this.getView().getModel("dialogModel");
                oDialogModel.setProperty("/title", "Sipariş Kalemleri: " + oSelectedOrder.Vbeln);
                oDialogModel.setProperty("/items", oSelectedOrder.GetOrderListItemSet.results);
                debugger
                // Dialog'u oluştur ve aç
                if (!this._oDisplayItemsDialog) {
                    Fragment.load({
                        id: this.getView().getId(),
                        name: "com.golive.erbakir.zerbakiregitim.view.fragments.OrderItems",
                        controller: this
                    }).then(function (oDialog) {
                        that._oDisplayItemsDialog = oDialog;
                        that.getView().addDependent(that._oDisplayItemsDialog);
                        that._oDisplayItemsDialog.open();
                    });
                } else {
                    this._oDisplayItemsDialog.open();
                }
            },

            /**
             * Sipariş kalemleri dialog'unu kapatır.
             * @public
             */
            onCloseOrderItemsDialog: function () {
                this.byId("orderItemsDialog").close();
            },



        });
    });