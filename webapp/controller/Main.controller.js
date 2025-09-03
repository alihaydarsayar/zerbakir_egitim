sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
],
    function (
        Controller,
        JSONModel,
        MessageToast,
        MessageBox
    ) {
        "use strict";

        return Controller.extend("com.golive.erbakir.zerbakiregitim.controller.Main", {
            onInit: function () {

                this.oDataModel = this.getOwnerComponent().getModel();
                this.oMainModel = this.getOwnerComponent().getModel("mainModel");
                var oViewJsonModel = new JSONModel(
                    {
                        busy: false,
                    }
                );
                this.getView().setModel(oViewJsonModel, "oMainViewModel");

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
                        that.getView().getModel("mainModel").setProperty("/customerList", oResults);
                        that.getView().getModel("oMainViewModel").setProperty("/customerList", oResults);
                    },
                    error: function (oError) {
                     MessageBox.error("Hata alındı");
                    }
                })

            },

            // onBeforeRendering: function(){

            // },
            // onAfterRendering: function(){

            // },
            // onExit: function(){

            // }


        });
    });
