sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/core/Fragment",
    "com/golive/erbakir/zerbakiregitim/model/formatter"
],
    function (
        Controller,
        JSONModel,
        MessageToast,
        MessageBox,
        Fragment,
        formatter
    ) {
        "use strict";

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
                            MessageToast.show(sMsg)
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
            }



        });
    });