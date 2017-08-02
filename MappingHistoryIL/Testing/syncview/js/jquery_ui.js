$(function () {
    $("#switchButton").on("click", function () {
        $("#switchButton").hide("fade", 125);
        $(".mainDiv").switchClass("mainDiv", "mainDivTrans1", 50, "linear", function () {
            $(".mainDivTrans1").switchClass("mainDivTrans1", "mainDivTrans2", 50, "linear", function () {
                $(".mainDivTrans2").switchClass("mainDivTrans2", "ovDiv", 300, "linear");
            });
        });
        $(".ovDiv").switchClass("ovDiv", "ovDivTrans1", 300, "linear", function () {
            $(".ovDivTrans1").switchClass("ovDivTrans1", "ovDivTrans2", 50, "linear", function () {
                $(".ovDivTrans2").switchClass("ovDivTrans2", "mainDiv", 50, "linear", $("#switchButton").show("fade", 500));
            });
        });

    });
});
