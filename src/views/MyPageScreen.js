import React, {useContext, useEffect, useState} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  PermissionsAndroid,
  TouchableWithoutFeedback,
} from 'react-native';
import {ScrollView} from 'react-native-gesture-handler';
import {CustomButton} from '../components/atoms';
import {CustomModal, Popup} from '../components/molecules';
import {AuthContext} from '../context';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import getClient from '../services/getClient';

const MyPageScreen = ({navigation}) => {
  const [popup, setPopup] = useState(false);
  const [modal, setModal] = useState(false);
  const [profile, setProfile] = useState({});
  const [user, dispatch] = useContext(AuthContext);

  const requestCameraPermission = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: 'App Camera Permission',
          message: 'App needs access to your camera ',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log('Camera permission given');
      } else {
        console.log('Camera permission denied');
      }
    } catch (err) {
      console.warn(err);
    }
  };

  const requestGalleryPermission = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        {
          title: 'App Storage Permission',
          message: 'App needs access to your storage ',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log('Storage permission given');
      } else {
        console.log('Storage permission denied');
      }
    } catch (err) {
      console.warn(err);
    }
  };

  const handleGetProfile = () => {
    console.log('Request Data Profile Display', {
      access_token: user.token,
      user_id: user.userId,
    });
    getClient
      .get('ProfileCtrl/ProfileDisplay', {
        params: {
          access_token: user.token,
          user_id: user.userId,
        },
      })
      .then(res => {
        if (res.data.status == 1) {
          setProfile(res.data);
        }
      });
  };

  const handleDeleteAccount = () => {
    console.log('Request Data Delete Account', {
      access_token: user.token,
    });
    getClient
      .get('AccountCtrl/DeleteAccount', {
        params: {
          access_token: user.token,
        },
      })
      .then(res => {
        if (res.data.statue == 1) {
          AsyncStorage.removeItem('USER').then(() => {
            dispatch({type: 'LOGOUT'});
          });
        }
      });
  };

  const handleDeleteImage = () => {
    console.log('Request Data Delete Image', {
      access_token: user.token,
      image_id: profile.imageId,
    });

    const headers = {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': 82,
    };
    const params = new URLSearchParams();
    params.append('image_id', profile.imageId);

    getClient
      .post(
        `ProfileCtrl/ProfileEdit?access_token=${user.token}`,
        params,
        headers,
      )
      .then(res => {
        if (res.data.status === 1) {
          handleGetProfile();
          alert('delete success!');
          setPopup(!popup);
        } else {
          alert('delete failed');
        }
      });
  };

  const handleUploadImage = image => {
    console.log('Request Data Image Upload', {
      access_token: user.token,
      image: image,
      location: 'Profile',
    });
    const url = 'MediaCtrl/ImageUpload';
    const headers = {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': 82,
    };
    const data = new FormData();
    data.append('data', {
      uri: Platform.OS === 'ios' ? image.uri.replace('file://', '') : image.uri,
      name: image.fileName,
      type: image.type,
    });

    getClient
      .post(url, data, {
        params: {
          access_token: user.token,
          location: 'Profile',
        },
        headers: headers,
      })
      .then(res => {
        if (res.data.status === 1) {
          handleGetProfile();
          setPopup(!popup);
        }
      });
  };

  useEffect(() => {
    navigation.addListener('focus', () => {
      handleGetProfile();
    });
  }, [navigation]);

  const openGallery = () => {
    const options = {
      mediaType: 'photo',
      quality: 1,
    };

    launchImageLibrary(options, res => {
      console.log(res);
      if (res.assets) {
        handleUploadImage(res.assets[0]);
      }
    });
  };

  const openCamera = () => {
    const options = {
      mediaType: 'photo',
      quality: 1,
    };

    const storagePermission = requestGalleryPermission();

    const cameraPermission = requestCameraPermission();
    if (cameraPermission && storagePermission) {
      launchCamera(options, res => {
        console.log(res);
        if (res.assets) {
          handleUploadImage(res.assets[0]);
        }
      });
    }
  };

  const handleLogout = () => {
    AsyncStorage.removeItem('USER').then(() => {
      dispatch({type: 'LOGOUT'});
    });
  };

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableWithoutFeedback onPress={() => handleLogout()}>
          <Text
            style={{
              paddingRight: 16,
              color: '#1644BD',
              fontWeight: 'bold',
            }}>
            Logout
          </Text>
        </TouchableWithoutFeedback>
      ),
    });
  }, []);

  return (
    <SafeAreaView>
      <ScrollView>
        <View>
          {popup && (
            <Popup popup={popup} setPopup={setPopup}>
              <>
                <CustomButton
                  theme="outline-primary"
                  title="Gallery"
                  onPress={() => openGallery()}
                />
                <CustomButton
                  theme="outline-primary"
                  title="Camera"
                  onPress={() => openCamera()}
                />
                {profile.imageUrl && (
                  <CustomButton
                    theme="outline-danger"
                    title="Delete"
                    onPress={() => handleDeleteImage()}
                  />
                )}
              </>
            </Popup>
          )}
          {modal && (
            <CustomModal modal={modal} setModal={setModal}>
              <Text
                style={{
                  textAlign: 'center',
                  fontWeight: '800',
                  color: 'black',
                  fontSize: 18,
                  marginBottom: 16,
                }}>
                Are you sure to delete account?
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                }}>
                <View style={{flex: 1, marginRight: 4}}>
                  <CustomButton
                    title="Cancel"
                    onPress={() => setModal(!modal)}
                    theme="outline-primary"
                  />
                </View>
                <View style={{flex: 1, marginLeft: 4}}>
                  <CustomButton
                    title="OK"
                    onPress={() => handleDeleteAccount()}
                    theme="primary"
                  />
                </View>
              </View>
            </CustomModal>
          )}
          <View style={{display: 'flex', padding: 16, width: '100%'}}>
            <View style={{flexDirection: 'row'}}>
              <TouchableOpacity onPress={() => setPopup(!popup)}>
                <Image
                  style={styles.profileimage}
                  source={{
                    uri: profile.imageUrl
                      ? profile.imageUrl
                      : 'https://via.placeholder.com/150',
                  }}
                />
              </TouchableOpacity>
              <View>
                <Text style={styles.profileemail}>
                  {profile && profile.nickname}
                </Text>
                <Text style={styles.profilepassword}>
                  {profile && profile.password}
                </Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate('EditProfileScreen')}
                  style={{
                    borderColor: '#1644BD',
                    borderStyle: 'solid',
                    borderWidth: 1,
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    width: '100%',
                    paddingVertical: 4,
                    marginLeft: 16,
                    marginTop: 4,
                  }}>
                  <Text
                    style={{
                      color: '#1644BD',
                      textAlign: 'center',
                      fontWeight: 'bold',
                    }}>
                    Edit Profile
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            <Text style={styles.label}>About Me</Text>
            <Text style={styles.profiledesc}>
              {profile.aboutMe ? profile.aboutMe : 'No Description'}
            </Text>
            <CustomButton
              title="Term & Condition"
              theme="primary"
              onPress={() => navigation.navigate('TermConditionScreen')}
            />
            <CustomButton
              title="Delete Account"
              theme="outline-danger"
              onPress={() => setModal(!modal)}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default MyPageScreen;

const styles = StyleSheet.create({
  profileimage: {
    width: 90,
    height: 90,
  },
  profileemail: {
    marginLeft: 20,
    fontWeight: 'bold',
    fontSize: 16,
    color: 'black',
  },
  profilepassword: {
    marginLeft: 20,
    marginTop: 8,
    fontWeight: 'bold',
    fontSize: 16,
    color: 'black',
  },
  label: {
    paddingTop: 40,
    fontWeight: 'bold',
    fontSize: 16,
    color: 'black',
  },
  profiledesc: {
    paddingVertical: 16,
    textAlign: 'justify',
    color: 'black',
  },
});
