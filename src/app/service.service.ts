import { Injectable } from "@angular/core";
import { Platform } from "@ionic/angular";
import * as $ from "jquery";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Router } from "@angular/router";
import { CookieService } from "ngx-cookie-service";
import { Storage } from "@ionic/storage";
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import { Http, HttpOptions } from "@capacitor-community/http";
import { from, Observable, Subscription } from "rxjs";
import { AlertController } from "@ionic/angular";
import { LoadingController } from "@ionic/angular";
import * as QRCode from "qrcode";
import { ToastController } from "@ionic/angular";
import "jspdf-autotable";
import jsPDF from "jspdf";
import Swal, { SweetAlertIcon } from "sweetalert2";
import { GetDataType, PostDataType } from "./service.types";
import { finalize } from "rxjs/operators";
import * as JsBarcode from "jsbarcode";

type CptSessionKeyType = {
  [key: string]: string;
};
type CptViewKeyType = {
  [key: string]: {
    "session-for": string;
    "cptid-keyname": string;
  };
};
type GenericJSONobj = {
  [key: string]: any;
};

export const environment: GenericJSONobj = {
  API_URL: "your-backend-url-here",
};

@Injectable({
  providedIn: "root",
})
export class ServiceService {
  session_key = "";
  cpt_session_keys: CptSessionKeyType = {
    mod0101: "",
  };
  cpt_views: CptViewKeyType = {
    mod0101: {
      "session-for": "captcha-login",
      "cptid-keyname": "cptid",
    },
  };

  lat: any;
  lon: any;

  result = {
    action: "1",
    response: {},
  };
  response = {};
  action = "1";

  isLoading = false;
  AppLoader: HTMLIonLoadingElement | null = null;

  show_spinner: boolean = false;

  private sharedData: any;

  nav_stack = [];
  backButtonSubscription: Subscription | undefined;

  alert_exist: boolean = false;

  MAX_FILESIZE_COMMON: number = 400 * 1024; // 400 kilobytes

  DefaultModuleName: any;

  current_att_loc_id: any = "";

  constructor(
    private http: HttpClient,
    public loadingController: LoadingController,
    public alertController: AlertController,
    private storage: Storage,
    public platform: Platform,
    private router: Router,
    private cookies: CookieService,
    private toastController: ToastController
  ) {
    console.log("test cpt id on service init :");
    for (const [key, value] of Object.entries(this.cpt_views)) {
      console.log(
        `
        view_name = ${key}; 
        key_name = ${value["cptid-keyname"]}; 
        key_value = ${this.localStorage.getItem(value["cptid-keyname"])}
        `
      );
    }
  }

  SplitUrl(url: String) {
    if (this.DefaultModuleName?.length) {
      return this.DefaultModuleName;
    } else {
      var parts = url.split("/");
      var lastPart = parts[parts.length - 1].split(";")[0];
      return lastPart;
    }
  }

  setSharedData(data: any) {
    this.sharedData = data;
  }

  getSharedData() {
    return this.sharedData;
  }

  //position:'top' | 'middle' | 'bottom'
  async presenttoast(
    msg: any,
    position: "top" | "middle" | "bottom" = "middle"
  ) {
    const toast = await this.toastController.create({
      message: msg,
      duration: 1500,
      position: position,
    });

    await toast.present();
  }

  IsValidMobileNumber(mobileNumber: string) {
    // Remove any non-digit characters
    const cleanedNumber = mobileNumber.replace(/\D/g, "");

    // Check if the cleaned number has exactly 10 digits and is not all zeros
    return /^\d{10}$/.test(cleanedNumber) && cleanedNumber !== "0000000000";
  }

  defaultErrHandler(err: any, onErrModalHide = () => {}) {
    const {
      error: errData,
      headers,
      message,
      name,
      status,
      statusText,
      url,
    } = err;
    console.log(err);

    let errText = "An error occurred";

    if (status == 403) {
      errText = errData?.detail || "Invalid Session Key";
      if (errText == "Session Expired") {
        // TODO: debug for android
        if (Capacitor.getPlatform() == "android") {
          // goto pinlogin page only for android app
          this.alert.warningAlert({
            text: "Your Session Has Expired, Please Login",
            action: "warning",
            callback: () => {
              onErrModalHide();
              window.location.replace("/pinlogin");
            },
          });
        } else {
          // alert and redirect to login after properly clearing localstorage data of user
          this.alert.warningAlert({
            text: "Your Session Has Expired, Please Login",
            action: "warning",
            callback: () => {
              onErrModalHide();
              this.logout();
            },
          });
        }
      } else {
        this.alert.warningAlert({
          text: errText,
          action: "error",
          callback: () => {
            onErrModalHide();
            this.logout();
          },
        });
      }
    } else if (status == 0) {
      errText = "Network Error";
      this.alert.warningAlert({
        text: errText,
        action: "error",
        callback: () => {
          // TODO: hide loader if needed
          onErrModalHide();
          if (this.show_spinner) this.show_spinner = false;
        },
      });
    } else {
      this.common_errorCb(err, "", onErrModalHide);
    }
  }

  common_errorCb = (err: any, errTxt = "", onModalHide = () => {}) => {
    console.log(err);
    let { error = 1, message = "An error occurred" } = err.error;
    if (error) {
      this.alert.warningAlert({
        text: errTxt || message,
        action: "error",
        callback: () => {
          // TODO: hide loader if needed
          onModalHide();
          if (this.show_spinner) this.show_spinner = false;
        },
      });
    } else {
      this.alert.warningAlert({
        text: message || "Network access working",
        // action: 'info',
        callback: () => {
          // TODO: hide loader if needed
          onModalHide();
          if (this.show_spinner) this.show_spinner = false;
        },
      });
    }
  };

  defaultCompleteHandler = () => {
    // console.log('http post completed');
  };

  call_http_post(
    postObj: PostDataType,
    control_spinner_locally: boolean = false
  ): Subscription {
    const {
      url,
      modname = "",
      isFormData = false,
      responseType,
      successCb = (response) => {},
      errorCb,
      afterError,
      completeCb = this.defaultCompleteHandler,
    }: PostDataType = postObj;

    let data: FormData | GenericJSONobj | undefined = postObj.data;
    if (!data) {
      if (isFormData) data = new FormData();
      else data = {};
    }

    if (isFormData) {
      if (!data.get("modname")) data.append("modname", modname);
    } else {
      // if (!data['modname'])
      if (!("modname" in data)) data = { ...data, modname };
    }

    const headers: GenericJSONobj = {
      Authorization: this.get_session_id_login(),
    };

    if (!isFormData) headers["Content-Type"] = "application/json";

    const requestOptions: GenericJSONobj = {
      headers,
    };

    if (responseType) requestOptions["responseType"] = responseType;

    let errorHandlerCb = (error: any) => {};
    if (!errorCb && !afterError) {
      errorHandlerCb = (err) => {
        this.defaultErrHandler(err);
      };
    } else if (errorCb) {
      errorHandlerCb = errorCb;
    } else if (afterError) {
      errorHandlerCb = (error) => {
        this.defaultErrHandler(error, () => {
          afterError(error);
        });
      };
    }

    // // using Http.request doesnt get intercepted by HttpInterceptor
    // const options: HttpOptions = { url, method: 'POST', headers, data };
    // return from(Http.request(options));

    if (!control_spinner_locally) this.show_spinner = true;

    return this.http
      .post(url, data, requestOptions)
      .pipe(
        finalize(() => {
          if (!control_spinner_locally) this.show_spinner = false;
          completeCb();
        })
      )
      .subscribe({ next: successCb, error: errorHandlerCb });
  }

  private getLSItem = (key: string) => {
    return this.ardService.removeRandomizer(localStorage.getItem(key) || "");
    // default value : null
  };

  private setLSItem = (key: string, value: string) => {
    if (value == null || value == undefined) value = "";
    localStorage.setItem(key, value);
  };

  private removeLSItem = (key: string) => {
    localStorage.removeItem(key);
  };

  localStorage = {
    getItem: this.getLSItem,
    setItem: this.setLSItem,
    removeItem: this.removeLSItem,
  };

  get_session_id_login() {
    // if (this.platform.is('cordova')) return "";
    return this.localStorage.getItem("token");
  }

  get_user_details_in_cookies() {
    return this.localStorage.getItem("user_name");
  }

  async confirmProceedToRegister() {
    if (this.alert_exist == false) {
      this.alert_exist = true;
      this.alert.confirmationAlert({
        title: "User Not Found",
        text: "Do You Want to Register ?",
        confirmCallback: () => {
          // this.show_spinner = false;
          this.alert_exist = false;
          this.router.navigate(["/mod0123"]);
        },
        cancelCallback: () => {
          this.warningAlert({
            title: "User Not Found",
            text: "Try again",
            action: "warning",
          });
          this.alert_exist = false;
        },
      });
    }
  }

  async presentConfirm(opts: any = {}) {
    const alert = await this.alertController.create({
      cssClass: "my-custom-class",
      header: opts.header || "",
      message: opts.text || "Kindly confirm this to proceed",
      buttons: [
        {
          text: opts.okBtnText || "OK",
          id: "confirm-button",
          handler: opts.okbtnHandler,
        },
        {
          text: "Cancel",
          role: "cancel",
          cssClass: "secondary",
          id: "cancel-button",
          handler: opts.cancelHandler,
        },
      ],
    });

    await alert.present();
  }

  presentModalLoader(
    props: {
      text?: string;
      showForMs?: number;
      onPresent?: () => void;
    } = {}
  ) {
    if (!this.isLoading) {
      console.log("loader called");
      let { text: message, showForMs: duration, onPresent = () => {} } = props;
      // console.log({ message, duration });
      this.isLoading = true;
      this.loadingController
        .create({
          message,
          duration,
          // animated: true, backdropDismiss: false,
        })
        .then((a) => {
          this.AppLoader = a;
          a.present().then(() => {
            console.log("loader presented");
            onPresent();
          });
        });
    }
  }

  dismissModalLoader(onDismiss: () => void = () => {}) {
    console.log("loader dismiss called");
    if (this.isLoading) {
      // if (!onDismiss) onDismiss = () => {};
      this.isLoading = false;
      if (this.AppLoader) {
        setTimeout(() => {
          if (this.AppLoader != null) {
            this.AppLoader.dismiss().then(() => {
              onDismiss();
              console.log("loader dismiss done");
              this.AppLoader = null;
            });
          }
        }, 500);
      }
    }
  }

  scroll_event(selector: string) {
    document?.querySelector(selector)?.scrollIntoView({
      behavior: "smooth",
      block: "center", // 'true
      inline: "center", // 'nearest'
    });
  }

  scroll_to_element(element: HTMLElement) {
    element.scrollIntoView({
      behavior: "smooth",
      block: "center", // 'true
      inline: "center", // 'nearest'
    });
  }

  scroll_to_top() {
    window.scroll({
      top: 0,
      left: 0,
      behavior: "smooth",
    });
  }

  onContentScroll(event: any) {
    // Handle the scroll event here
    // You can access event.detail.scrollTop to get the current scroll position
    const scrollTop = event.detail.scrollTop;
    console.log("Scroll position:", scrollTop);

    // You can add your custom logic based on the scroll position
    if (scrollTop > 100) {
      // Do something when scrolled beyond a certain point
    }
  }

  async confirmExitApp() {
    if (this.alert_exist == false) {
      this.alert_exist = true;
      this.alert.confirmationAlert({
        title: "Confirmation",
        text: "Are You Sure Want To Exit The App?",
        action: "warning",
        confirmBtnText: "Yes, proceed",
        cancelBtnText: "No, cancel",
        confirmCallback: () => {
          this.alert_exist = false;
          App.exitApp();
        },
        cancelCallback: () => {
          this.alert_exist = false;
        },
      });
    }
  }

  getDT(dt: any) {
    let dtObj = new Date(dt);
    return dtObj.toLocaleDateString() + " " + dtObj.toLocaleTimeString();
  }
  getMonthName(m: number) {
    var month_names = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    return month_names[m];
  }
  getMonthNameShort(m: number) {
    var month_names_short = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    return month_names_short[m];
  }

  getDTperFormat(dt: any, format = "dd/MM/yyyy hh:mm ap") {
    let dtObj = new Date(dt);
    format = format.replace(
      "yyyy",
      String(dtObj.getFullYear()).padStart(4, "0")
    );
    format = format.replace("MMMM", this.getMonthName(dtObj.getMonth()));
    format = format.replace("MMM", this.getMonthNameShort(dtObj.getMonth()));
    format = format.replace(
      "MM",
      String(dtObj.getMonth() + 1).padStart(2, "0")
    );
    format = format.replace("dd", String(dtObj.getDate()).padStart(2, "0"));
    format = format.replace("HH", String(dtObj.getHours()).padStart(2, "0"));
    format = format.replace("mm", String(dtObj.getMinutes()).padStart(2, "0"));
    let hr = dtObj.getHours();
    let hh = hr % 12;
    let apm = "AM";
    if (hr >= 12) {
      apm = "PM";
      if (hr == 12) hh = 12;
    }
    format = format.replace("hh", String(hh).padStart(2, "0"));
    format = format.replace("ss", String(dtObj.getSeconds()).padStart(2, "0"));
    format = format.replace("ap", apm);
    return format;
  }

  getUTCdateStr(dt: any) {
    let dtObj = new Date(dt);
    return (
      dtObj.getUTCFullYear() +
      "-" +
      String(dtObj.getUTCMonth() + 1).padStart(2, "0") +
      "-" +
      String(dtObj.getUTCDate()).padStart(2, "0") +
      " " +
      String(dtObj.getUTCHours()).padStart(2, "0") +
      ":" +
      String(dtObj.getUTCMinutes()).padStart(2, "0") +
      ":00"
    );
  }

  // should be done in backend
  validateAdmin() {
    return this.localStorage.getItem("isAdmin") == "true";
  }

  intToEnglish(number: any): string {
    var NS = [
      { value: 10000000, str: "Crore" },
      { value: 100000, str: "Lakh" },
      { value: 1000, str: "Thousand" },
      { value: 100, str: "Hundred" },
      { value: 90, str: "Ninety" },
      { value: 80, str: "Eighty" },
      { value: 70, str: "Seventy" },
      { value: 60, str: "Sixty" },
      { value: 50, str: "Fifty" },
      { value: 40, str: "Forty" },
      { value: 30, str: "Thirty" },
      { value: 20, str: "Twenty" },
      { value: 19, str: "Nineteen" },
      { value: 18, str: "Eighteen" },
      { value: 17, str: "Seventeen" },
      { value: 16, str: "Sixteen" },
      { value: 15, str: "Fifteen" },
      { value: 14, str: "Fourteen" },
      { value: 13, str: "Thirteen" },
      { value: 12, str: "Twelve" },
      { value: 11, str: "Eleven" },
      { value: 10, str: "Ten" },
      { value: 9, str: "Nine" },
      { value: 8, str: "Eight" },
      { value: 7, str: "Seven" },
      { value: 6, str: "Six" },
      { value: 5, str: "Five" },
      { value: 4, str: "Four" },
      { value: 3, str: "Three" },
      { value: 2, str: "Two" },
      { value: 1, str: "One" },
    ];

    var result = "";
    for (var n of NS) {
      if (number >= n.value) {
        if (number <= 99) {
          result += n.str;
          number -= n.value;
          if (number > 0) result += " ";
        } else {
          var t = Math.floor(number / n.value);
          // console.log(t);
          var d = number % n.value;
          if (d > 0) {
            return (
              this.intToEnglish(t) + " " + n.str + " " + this.intToEnglish(d)
            );
          } else {
            return this.intToEnglish(t) + " " + n.str;
          }
        }
      }
    }
    return result;
  }

  // ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

  // ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

  alert = {
    warningAlert: this.warningAlert,
    confirmationAlert: this.confirmationAlert,
  };

  private warningAlert(props: {
    title?: string;
    text: string;
    time?: any;
    action?: "success" | "update" | "delete" | "warning" | "error";
    iconColor?: string;
    iconHtml?: string;
    btnColor?: string;
    btnText?: string;
    callback?: () => void;
    // customClass?: {
    //   [key: string]: string
    // }
  }) {
    const {
      title,
      text,
      time,
      action,
      iconColor,
      btnColor,
      btnText,
      iconHtml,
      callback,
    } = props;
    let sweetAlertIcon: SweetAlertIcon = "info";
    let setColor: string;
    let setIconHtml: string;
    let setTitle: string;

    switch (action) {
      case "success":
        setTitle = "Success";
        setIconHtml =
          '<i class="fa-solid fa-check fa-shake" style="--fa-animation-duration: 2s; --fa-animation-iteration-count: 1;"></i>';
        setColor = "#30a702";
        sweetAlertIcon = "success";
        break;
      case "update":
        setTitle = "Updated";
        setIconHtml =
          '<i class="fa-solid fa-check fa-shake" style="--fa-animation-duration: 2s; --fa-animation-iteration-count: 1;"></i>';
        setColor = "#0000FF";
        sweetAlertIcon = "success";
        break;
      case "delete":
        setTitle = "Deleted";
        setIconHtml =
          '<i class="fa-regular fa-trash-can fa-shake" style="--fa-animation-duration: 2s; --fa-animation-iteration-count: 1;"></i>';
        setColor = "#FF0000";
        sweetAlertIcon = "success";
        break;
      case "warning":
        setTitle = "Warning!";
        setIconHtml =
          '<i class="fa-solid fa-exclamation fa-shake" style="--fa-animation-duration: 2s; --fa-animation-iteration-count: 1;"></i>';
        setColor = "#F6BE00";
        sweetAlertIcon = "warning";
        break;
      case "error":
        setTitle = "Error!";
        setIconHtml =
          '<i class="fa-solid fa-x fa-shake" style="--fa-animation-duration: 2s; --fa-animation-iteration-count: 1;"></i>';
        setColor = "#FF0000";
        sweetAlertIcon = "error";
        break;
      default:
        setTitle = "";
        setIconHtml =
          '<i class="fa-solid fa-check fa-shake" style="--fa-animation-duration: 2s; --fa-animation-iteration-count: 1;"></i>';
        setColor = "#6C0BA9";
        sweetAlertIcon = "info";
        break;
    }

    setColor = iconColor || setColor;

    let iconProps: { iconHtml?: string; icon?: SweetAlertIcon } = {
      iconHtml: iconHtml || setIconHtml,
    };
    if (!iconProps.iconHtml) {
      iconProps = { icon: sweetAlertIcon };
    }

    Swal.fire({
      title: title || setTitle,
      html: text,
      timer: time,
      iconColor: setColor,
      confirmButtonColor: btnColor || "#6C0BA9",
      confirmButtonText: btnText || "OK",
      customClass: {
        popup: "cus-sweet-alert",
        // title: 'custom-title-class',
        // icon: 'custom-icon-class',
        // Add other classes as needed
      },
      ...iconProps,
      // customClass: {
      //   icon: 'no-border'
      // },
    }).then(callback);

    document.body.classList.remove("swal2-height-auto"); // to align modal vertically centered
  }

  private confirmationAlert(props: {
    title?: string;
    text: string;
    action?: "delete" | "warning" | "logout";
    iconColor?: string;
    iconHtml?: string;
    confirmBtnText?: string;
    confirmBtnColor?: string;
    cancelBtnText?: string;
    cancelBtnColor?: string;
    confirmCallback?: () => void;
    cancelCallback?: () => void;
  }) {
    const {
      title,
      text,
      action,
      iconColor,
      iconHtml,
      confirmBtnText,
      confirmBtnColor,
      cancelBtnText,
      cancelBtnColor,
      confirmCallback = () => {},
      cancelCallback = () => {},
    } = props;
    let sweetAlertIcon: SweetAlertIcon = "question";
    let setColor: string;
    let setIconHtml: string;

    switch (action) {
      case "delete":
        setIconHtml =
          '<i class="fa-regular fa-trash-can fa-shake" style="--fa-animation-duration: 2s; --fa-animation-iteration-count: 1;"></i>';
        setColor = "#FF0000";
        break;
      case "warning":
        setIconHtml =
          '<i class="fa-solid fa-exclamation fa-shake" style="--fa-animation-duration: 2s; --fa-animation-iteration-count: 1;"></i>';
        setColor = "#F6BE00";
        sweetAlertIcon = "warning";

        break;
      case "logout":
        setIconHtml =
          '<i class="fa-solid fa-arrow-right-from-bracket fa-shake" style="--fa-animation-duration: 2s; --fa-animation-iteration-count: 1;"></i>';
        setColor = "#6C0BA9";
        break;
      default:
        setIconHtml =
          '<i class="fa-solid fa-exclamation fa-shake" style="--fa-animation-duration: 2s; --fa-animation-iteration-count: 1;"></i>';
        setColor = "#6C0BA9";
        break;
    }

    setColor = iconColor || setColor;

    let iconProps: { iconHtml?: string; icon?: SweetAlertIcon } = {
      iconHtml: iconHtml || setIconHtml,
    };
    if (!iconProps.iconHtml) {
      iconProps = { icon: sweetAlertIcon };
    }

    Swal.fire({
      title: title || "Are you sure?",
      html: text,
      iconColor: setColor,
      showCancelButton: true,
      confirmButtonText: confirmBtnText || "Confirm",
      confirmButtonColor: confirmBtnColor || "#6C0BA9",
      cancelButtonText: cancelBtnText || "Cancel",
      cancelButtonColor: cancelBtnColor,
      // reverseButtons: true,
      customClass: {
        popup: "cus-sweet-alert",
        // title: 'custom-title-class',
        // icon: 'custom-icon-class',
        // Add other classes as needed
      },
      ...iconProps,
    }).then((result) => {
      if (result.isConfirmed) {
        confirmCallback();
      } else if (
        result.isDismissed &&
        result.dismiss === Swal.DismissReason.cancel
      ) {
        cancelCallback();
      }
    });
    document.body.classList.remove("swal2-height-auto"); // to align modal vertically centered
  }

  // Define showResultAlert function
  showResultAlert(title: string, text: string, icon: SweetAlertIcon) {
    Swal.fire({
      title: title,
      text: text,
      icon: icon,
    });
    document.body.classList.remove("swal2-height-auto"); // to align modal vertically centered
  }

  relational_date_validation(startDate: any, endDate: any) {
    if (new Date(startDate) <= new Date(endDate)) {
      return true;
    } else {
      // if (new Date(startDate) > new Date(endDate))
      return false;
    }
  }

  validate_aadhaar_no(txt: string) {
    let aadhar_regex = /^[2-9]{1}[0-9]{11}$/;
    return !aadhar_regex.test(txt);
  }

  validate_pan_no(txt: string) {
    let pan_regex = /^[a-zA-Z]{5}[0-9]{4}[a-zA-Z]{1}$/;
    return !pan_regex.test(txt);
  }

  validate_email(txt: string) {
    let email_regex =
      /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{3,}))$/;
    // let email_regex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/
    // /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/
    return email_regex.test(String(txt));
  }

  validate_phone_no(txt: string) {
    // Check if it has exactly 10 digits and is not all zeros
    return /^\d{10}$/.test(txt) && txt !== "0000000000";
  }

  // to check if the text contains only alpabets (a-z) or (A-Z)
  check_only_alphabet(id: any) {
    var text = $(id).val();
    var regapha = /^[A-Za-z]+$/;
    return regapha.test(String(text)) || text == "";
  }

  // only allow ALphapets
  keyPressAlphaNumeric(event: any) {
    var inp = String.fromCharCode(event.keyCode);

    if (/^[a-zA-Z\s]$/.test(inp)) {
      return true;
    } else {
      event.preventDefault();
      return false;
    }
  }

  check_only_wholenumber(txt: string) {
    var num_reg = /^[0-9]+$/;
    return num_reg.test(txt);
  }

  check_only_decimalnumber(txt: string) {
    var num_reg = /^\d+(\.\d+)?$/;
    return num_reg.test(txt);
  }

  // Only Integer Numbers
  keyPressNumbers(event: any) {
    var charCode = event.which ? event.which : event.keyCode;
    // Only Numbers 0-9
    if (charCode < 48 || charCode > 57) {
      event.preventDefault();
      return false;
    } else {
      return true;
    }
  }

  // Only Integer Numbers and Dot
  keyPressNumbersAndDot(event: any) {
    // var charCode = event.which ? event.which : event.keyCode;
    var inp = String.fromCharCode(event.keyCode);
    if (/^[\.0-9]$/.test(inp)) {
      return true;
    } else {
      event.preventDefault();
      return false;
    }
  }

  // to open file in new tab

  view_privew_url(doc: any) {
    var url = environment.API_URL + "media" + "/" + doc;
    window.open(url, "_blank");
  }

  view_privew_url_src_only(doc: any) {
    var url = environment.API_URL + "media" + "/" + doc;
    return url;
  }

  setCSSVariable(variable: string, value: string): void {
    // Access the root element (:root) and set the CSS variable
    document.documentElement.style.setProperty(variable, value);
  }
}
