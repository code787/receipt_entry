plugins {
    id("com.android.application")
    id("dev.flutter.flutter-gradle-plugin")
}

dependencies {
    implementation("com.google.mlkit:text-recognition-chinese:16.0.1")
}

android {
    namespace = "com.example.receipt_entry"
    compileSdk = flutter.compileSdkVersion
    ndkVersion = flutter.ndkVersion

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    signingConfigs {
        create("release") {
            // 优先从环境变量读取签名配置（CI/CD 用）
            val storeFileEnv = System.getenv("KEYSTORE_FILE")
            if (storeFileEnv != null) {
                storeFile = file(storeFileEnv)
                storePassword = System.getenv("KEYSTORE_PASSWORD") ?: ""
                keyAlias = System.getenv("KEY_ALIAS") ?: ""
                keyPassword = System.getenv("KEY_PASSWORD") ?: ""
            } else {
                // 本地开发：使用 debug 签名
                val debugStore = gradle.gradleUserHomeDir.resolve("android/debug.keystore")
                if (debugStore.exists()) {
                    storeFile = debugStore
                    storePassword = "android"
                    keyAlias = "androiddebugkey"
                    keyPassword = "android"
                }
            }
        }
    }

    defaultConfig {
        applicationId = "com.receiptentry.app"
        minSdk = 23
        targetSdk = flutter.targetSdkVersion
        versionCode = flutter.versionCode
        versionName = flutter.versionName
    }

    buildTypes {
        release {
            signingConfig = signingConfigs.getByName("release")
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
        debug {
            isMinifyEnabled = false
        }
    }
}

kotlin {
    compilerOptions {
        jvmTarget = org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17
    }
}

flutter {
    source = "../.."
}