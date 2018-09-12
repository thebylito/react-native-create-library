module.exports = platform => [{
    name: () => `${platform}/build.gradle`,
    content: ({ packageIdentifier }) => `
buildscript {
    repositories {
        google()
        maven {
            url "https://maven.google.com"
        }
        jcenter()
    }

    dependencies {
        classpath 'com.android.tools.build:gradle:3.1.3'
    }
}

apply plugin: 'com.android.library'
apply plugin: 'maven'

def DEFAULT_COMPILE_SDK_VERSION = 27
def DEFAULT_BUILD_TOOLS_VERSION = "27.0.3"
def DEFAULT_TARGET_SDK_VERSION = 26

android {
    compileSdkVersion rootProject.hasProperty('compileSdkVersion') ? rootProject.compileSdkVersion : DEFAULT_COMPILE_SDK_VERSION
    buildToolsVersion rootProject.hasProperty('buildToolsVersion') ? rootProject.buildToolsVersion : DEFAULT_BUILD_TOOLS_VERSION

    defaultConfig {
        minSdkVersion 16
        targetSdkVersion rootProject.hasProperty('targetSdkVersion') ? rootProject.targetSdkVersion : DEFAULT_TARGET_SDK_VERSION
        versionCode 1
        versionName "1.0"
    }
    lintOptions {
        abortOnError false
    }
}

repositories {
    maven {
        url "$projectDir/../node_modules/react-native/android"
    }
    mavenCentral()
}

dependencies {
    api 'com.facebook.react:react-native:+'
}

def configureReactNativePom(def pom) {
    def packageJson = new groovy.json.JsonSlurper().parseText(file('../package.json').text)

    pom.project {
        name packageJson.title
        artifactId packageJson.name
        version = packageJson.version
        group = "${packageIdentifier}"
        description packageJson.description
        url packageJson.repository.baseUrl

        licenses {
            license {
                name packageJson.license
                url packageJson.repository.baseUrl + '/blob/master/' + packageJson.licenseFilename
                distribution 'repo'
            }
        }

        developers {
            developer {
                id packageJson.author.username
                name packageJson.author.name
            }
        }
    }
}

afterEvaluate { project ->

    task androidJavadoc(type: Javadoc) {
        source = android.sourceSets.main.java.srcDirs
        classpath += files(android.bootClasspath)
        classpath += files(project.getConfigurations().getByName('compile').asList())
        include '**/*.java'
    }

    task androidJavadocJar(type: Jar, dependsOn: androidJavadoc) {
        classifier = 'javadoc'
        from androidJavadoc.destinationDir
    }

    task androidSourcesJar(type: Jar) {
        classifier = 'sources'
        from android.sourceSets.main.java.srcDirs
        include '**/*.java'
    }

    android.libraryVariants.all { variant ->
        def name = variant.name.capitalize()
        task "jar$\{name\}"(type: Jar, dependsOn: variant.javaCompile) {
            from variant.javaCompile.destinationDir
        }
    }

    artifacts {
        archives androidSourcesJar
        archives androidJavadocJar
    }

    task installArchives(type: Upload) {
        configuration = configurations.archives
        repositories.mavenDeployer {
            // Deploy to react-native-event-bridge/maven, ready to publish to npm
            repository url: "file://$\{projectDir\}/../android/maven"

            configureReactNativePom pom
        }
    }
}
  `,
}, {
    name: () => `${platform}/src/main/AndroidManifest.xml`,
    content: ({ packageIdentifier }) => `
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
          package="${packageIdentifier}">

</manifest>
  `,
}, {
    name: ({ packageIdentifier, name }) =>
        `${platform}/src/main/java/${packageIdentifier.split('.').join('/')}/${name}Module.java`,
    content: ({ packageIdentifier, name }) => `
package ${packageIdentifier};

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class ${name}Module extends ReactContextBaseJavaModule {

  private final ReactApplicationContext reactContext;

  public ${name}Module(ReactApplicationContext reactContext) {
    super(reactContext);
    this.reactContext = reactContext;
  }

  @Override
  public String getName() {
    return "${name}";
  }

  @ReactMethod
  public void acao(){
    Log.d("RNNA", "OLAAAAA");
  }

}`,
}, {
    name: ({ packageIdentifier, name }) =>
        `${platform}/src/main/java/${packageIdentifier.split('.').join('/')}/${name}Package.java`,
    content: ({ packageIdentifier, name }) => `
package ${packageIdentifier};

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;
import com.facebook.react.bridge.JavaScriptModule;

public class ${name}Package implements ReactPackage {
    @Override
    public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
      return Arrays.<NativeModule>asList(new ${name}Module(reactContext));
    }

    // Deprecated from RN 0.47
    public List<Class<? extends JavaScriptModule>> createJSModules() {
      return Collections.emptyList();
    }

    @Override
    public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
        return Arrays.<ViewManager>asList(
            new ${name}Manager()
    );
    }
}`,
}, {
    name: ({ packageIdentifier, name }) =>
        `${platform}/src/main/java/${packageIdentifier.split('.').join('/')}/${name}Manager.java`,
    content: ({ packageIdentifier, name }) => `
package ${packageIdentifier};

import android.app.Activity;
import android.support.annotation.Nullable;
import android.util.Log;
import android.view.View;

import java.util.Map;


import com.facebook.infer.annotation.Assertions;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.annotations.ReactProp;

public class ${name}Manager extends SimpleViewManager<View> {
    private ThemedReactContext mContext = null;
    private Activity mActivity = null;

    public static final String REACT_CLASS = "${name}Manager";
    public static final int NAME = 1;
    public static final int NAME2 = 2;

    @Override
    public String getName() {
        // Tell React the name of the module
        // https://facebook.github.io/react-native/docs/native-components-android.html#1-create-the-viewmanager-subclass
        return REACT_CLASS;
    }
    @Override
    public View createViewInstance(ThemedReactContext reactContext) {
        mContext = reactContext;
        mActivity = mContext.getCurrentActivity();
        return new View(mContext);
    }

    @ReactProp(name = "prop")
    public void methodProp(View view, String prop) {

    }

    @Override
    public Map<String,Integer> getCommandsMap() {
        Log.d("React"," View manager getCommandsMap:");
        return MapBuilder.of(
                "name",
                NAME,
                "name2",
                NAME2);
    }

    @Override
    public void receiveCommand(
            View view,
            int commandType,
            @Nullable ReadableArray args) {
        Assertions.assertNotNull(view);
        Assertions.assertNotNull(args);
        switch (commandType) {
            case NAME: {
                // action()
                return;
            }
            case NAME2: {
                // action()
                return;
            }

            default:
                throw new IllegalArgumentException(String.format(
                        "Unsupported command %d received by %s.",
                        commandType,
                        getClass().getSimpleName()));
        }
    }
}`,
}, {
    name: () => `${platform}/README.md`,
    content: () => `
README
======

If you want to publish the lib as a maven dependency, follow these steps before publishing a new version to npm:

1. Be sure to have the Android [SDK](https://developer.android.com/studio/index.html) and [NDK](https://developer.android.com/ndk/guides/index.html) installed
2. Be sure to have a \`local.properties\` file in this folder that points to the Android SDK and NDK
\`\`\`
ndk.dir=/Users/{username}/Library/Android/sdk/ndk-bundle
sdk.dir=/Users/{username}/Library/Android/sdk
\`\`\`
3. Delete the \`maven\` folder
4. Run \`sudo ./gradlew installArchives\`
5. Verify that latest set of generated files is in the maven folder with the correct version number
`}];
