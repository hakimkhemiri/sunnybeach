import { MapPin, Phone, Mail, Clock } from 'lucide-react';

export function Map() {
  return (
    <section id="map" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Notre <span className="text-orange-500">Localisation</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Venez nous rendre visite et découvrez notre cadre exceptionnel
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-orange-50 to-white p-8 rounded-2xl shadow-lg border border-orange-100">
              <div className="flex items-start space-x-4">
                <div className="bg-orange-500 p-3 rounded-lg">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Adresse</h3>
                  <p className="text-gray-600">
                    123 Boulevard de la Plage
                    <br />
                    06000 Nice, France
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-white p-8 rounded-2xl shadow-lg border border-orange-100">
              <div className="flex items-start space-x-4">
                <div className="bg-orange-500 p-3 rounded-lg">
                  <Phone className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Téléphone</h3>
                  <p className="text-gray-600">
                    +33 4 93 00 00 00
                    <br />
                    Réservations: +33 4 93 11 11 11
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-white p-8 rounded-2xl shadow-lg border border-orange-100">
              <div className="flex items-start space-x-4">
                <div className="bg-orange-500 p-3 rounded-lg">
                  <Mail className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Email</h3>
                  <p className="text-gray-600">
                    contact@sunnybeach.fr
                    <br />
                    reservation@sunnybeach.fr
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-white p-8 rounded-2xl shadow-lg border border-orange-100">
              <div className="flex items-start space-x-4">
                <div className="bg-orange-500 p-3 rounded-lg">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Horaires</h3>
                  <div className="text-gray-600 space-y-1">
                    <p>Lundi - Vendredi: 11h00 - 23h00</p>
                    <p>Samedi - Dimanche: 10h00 - 00h00</p>
                    <p className="text-orange-600 font-semibold mt-2">Ouvert tous les jours</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="h-[600px] rounded-2xl overflow-hidden shadow-2xl">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2884.4945716636234!2d7.265866!3d43.697037!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x12cdd0106a852d31%3A0x40819a5fd979a70!2sPromenade%20des%20Anglais%2C%20Nice%2C%20France!5e0!3m2!1sen!2sus!4v1234567890"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Sunny Beach Location"
            ></iframe>
          </div>
        </div>
      </div>
    </section>
  );
}
