#include "esp_camera.h" 
#include "FS.h" 
#include "SD_MMC.h" 
#include "WiFi.h" 
#include "HTTPClient.h" 
#include <Preferences.h> 
#include <esp_now.h>

#define CAMERA_MODEL_AI_THINKER 
#include "camera_pins.h" 
 
const char* ssid = "Pixel_6pro";
const char* password = "12345687";

const char* firebaseHost = "l1project-681ca.firebaseio.com";
const char* firebaseAuth = "OEy9Z13kNtQjxoZ6YQ0v5rh9Wc9ESDhUqUhBsFKV";
const char* firebaseStorageBucket = "l1project-681ca.appspot.com";

const int numImagesPerAttempt = 10; 
 
int folderNumber = 0; 
 
Preferences preferences; 
 
bool startCapture = false;

void startCamera() { 
  camera_config_t config; 
  config.ledc_channel = LEDC_CHANNEL_0; 
  config.ledc_timer = LEDC_TIMER_0; 
  config.pin_d0 = Y2_GPIO_NUM; 
  config.pin_d1 = Y3_GPIO_NUM; 
  config.pin_d2 = Y4_GPIO_NUM; 
  config.pin_d3 = Y5_GPIO_NUM; 
  config.pin_d4 = Y6_GPIO_NUM; 
  config.pin_d5 = Y7_GPIO_NUM; 
  config.pin_d6 = Y8_GPIO_NUM; 
  config.pin_d7 = Y9_GPIO_NUM; 
  config.pin_xclk = XCLK_GPIO_NUM; 
  config.pin_pclk = PCLK_GPIO_NUM; 
  config.pin_vsync = VSYNC_GPIO_NUM; 
  config.pin_href = HREF_GPIO_NUM; 
  config.pin_sccb_sda = SIOD_GPIO_NUM; 
  config.pin_sccb_scl = SIOC_GPIO_NUM; 
  config.pin_pwdn = PWDN_GPIO_NUM; 
  config.pin_reset = RESET_GPIO_NUM; 
  config.xclk_freq_hz = 20000000; 
  config.pixel_format = PIXFORMAT_JPEG; 
 
  if (psramFound()) { 
    config.frame_size = FRAMESIZE_UXGA; 
    config.jpeg_quality = 10; 
    config.fb_count = 2; 
  } else { 
    config.frame_size = FRAMESIZE_SVGA; 
    config.jpeg_quality = 12; 
    config.fb_count = 1; 
  } 
 
  esp_err_t err = esp_camera_init(&config); 
  if (err != ESP_OK) { 
    Serial.printf("Camera init failed with error 0x%x\n", err); 
    return; 
  } 
} 

void onDataRecv(const esp_now_recv_info *recvInfo, const uint8_t *incomingData, int len) {
  Serial.println("Signal received to start capturing images.");
  startCapture = true;
}
 
void setup() { 
  Serial.begin(115200); 

  WiFi.mode(WIFI_STA);
  WiFi.disconnect();
  delay(100);

  if (esp_now_init() != ESP_OK) {
    Serial.println("Error initializing ESP-NOW");
    return;
  }
  esp_now_register_recv_cb(onDataRecv);

  if (!SD_MMC.begin()) { 
    Serial.println("Card Mount Failed"); 
    return; 
  } 
  uint8_t cardType = SD_MMC.cardType(); 
  if (cardType == CARD_NONE) { 
    Serial.println("No SD card attached"); 
    return; 
  } 
 
  WiFi.begin(ssid, password); 
  while (WiFi.status() != WL_CONNECTED) { 
    delay(1000); 
    Serial.println("Connecting to WiFi..."); 
  } 
  Serial.println("Connected to WiFi"); 
 
  startCamera(); 
 
  preferences.begin("camera", false); 
  folderNumber = preferences.getInt("folderNumber", 0); 
  preferences.end(); 
 
  Serial.println("Setup complete. Waiting for signal to capture images..."); 
} 
 
void loop() { 
  if (startCapture) {
    startCapture = false;

    String folderName = getFolderName(folderNumber); 

    fs::FS &fs = SD_MMC; 
    fs.mkdir("/" + folderName); 

    for (int i = 0; i < numImagesPerAttempt; i++) { 
      captureAndSaveImage(folderName, i); 
      delay(10); 
    } 

    uploadFolderToFirebase(folderName); 

    folderNumber++; 
    preferences.begin("camera", false);
    preferences.putInt("folderNumber", folderNumber); 
    preferences.end(); 

    Serial.println("Image capture and upload complete. Waiting for next signal...");
  }
} 
 
String getFolderName(int folderNum) { 
  return String(folderNum); 
} 
 
void captureAndSaveImage(const String& folderName, int imageIndex) { 
  camera_fb_t * fb = esp_camera_fb_get(); 
  if (!fb) { 
    Serial.println("Camera capture failed"); 
    return; 
  } 
 
  String path = "/" + folderName + "/image" + String(imageIndex) + ".jpg"; 
  fs::FS &fs = SD_MMC; 
 
  File file = fs.open(path.c_str(), FILE_WRITE); 
  if (!file) { 
    Serial.println("Failed to open file in writing mode"); 
  } else { 
    file.write(fb->buf, fb->len); 
    Serial.printf("Saved file to path: %s\n", path.c_str()); 
  } 
  file.close(); 
 
  esp_camera_fb_return(fb); 
} 
 
void uploadImageToFirebaseStorage(const uint8_t *image, size_t len, const String& folderName, const String& fileName) { 
  String url = "https://firebasestorage.googleapis.com/v0/b/" + String(firebaseStorageBucket) + "/o/" + folderName + "%2F" + fileName + "?uploadType=media&name=" + folderName + "/" + fileName; 
   
  HTTPClient http; 
  http.begin(url); 
  http.addHeader("Content-Type", "image/jpeg"); 
  int httpResponseCode = http.POST((uint8_t*)image, len); 
 
  if (httpResponseCode > 0) { 
    String response = http.getString(); 
    Serial.println(httpResponseCode); 
    Serial.println(response); 
 
    int start = response.indexOf("\"downloadTokens\":\"") + 18; 
    int end = response.indexOf("\"", start); 
    String downloadURL = "https://firebasestorage.googleapis.com/v0/b/" + String(firebaseStorageBucket) + "/o/" + folderName + "%2F" + fileName + "?alt=media&token=" + response.substring(start, end); 
 
    uploadMetadataToFirebaseDatabase(downloadURL, folderName, fileName); 
  } else { 
    Serial.print("Error on sending POST: "); 
    Serial.println(httpResponseCode); 
    Serial.println(http.errorToString(httpResponseCode).c_str()); 
  } 
  http.end(); 
} 
 
void uploadMetadataToFirebaseDatabase(const String& downloadURL, const String& folderName, const String& fileName) { 
  String url = "https://" + String(firebaseHost) + "/images.json?auth=" + String(firebaseAuth); 
  HTTPClient http; 
  http.begin(url); 
  http.addHeader("Content-Type", "application/json"); 
 
  String jsonPayload = "{\"url\":\"" + downloadURL + "\", \"folder\":\"" + folderName + "\", \"file\":\"" + fileName + "\"}"; 
  int httpResponseCode = http.POST(jsonPayload); 
 
  if (httpResponseCode > 0) { 
    String response = http.getString(); 
    Serial.println(httpResponseCode); 
    Serial.println(response); 
  } else { 
    Serial.print("Error on sending POST: "); 
    Serial.println(httpResponseCode); 
    Serial.println(http.errorToString(httpResponseCode).c_str()); 
  } 
  http.end(); 
} 
 
void uploadFolderToFirebase(const String& folderName) { 
  fs::FS &fs = SD_MMC; 
  File root = fs.open("/" + folderName); 

  if (!root) { 
    Serial.printf("Failed to open directory: %s\n", folderName.c_str()); 
    return; 
  } 

  File file = root.openNextFile(); 
  while (file) { 
    size_t fileSize = file.size(); 
    uint8_t *buffer = (uint8_t*) malloc(fileSize); 
    file.read(buffer, fileSize); 
    String fileName = file.name(); 
    fileName = fileName.substring(fileName.lastIndexOf('/') + 1); 
    uploadImageToFirebaseStorage(buffer, fileSize, folderName, fileName); 
    free(buffer); 
    file.close(); 
    file = root.openNextFile(); 
  } 
  Serial.printf("Folder %s has been uploaded to Firebase.\n", folderName.c_str()); 

  root.rewindDirectory(); 
  file = root.openNextFile(); 
  while (file) { 
    fs.remove(file.name()); 
    file.close(); 
    file = root.openNextFile(); 
  }

  fs.rmdir("/" + folderName);
  Serial.printf("Folder %s has been deleted from SD card.\n", folderName.c_str());
}


